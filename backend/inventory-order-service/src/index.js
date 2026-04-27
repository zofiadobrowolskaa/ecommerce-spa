const express = require('express');
const knex = require('knex')(require('../knexfile').development);
const { sequelize, Cart, CartLine } = require('./db/sequelize');
const pgPool = require('./db/pgPool');
const pgErrorMap = require('./middleware/errorMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(express.json());

// simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'inventory-order-service' });
});

// CATALOG (KNEX)

// dynamic filtering endpoint
app.get('/products', async (req, res) => {
  const { category, maxPrice } = req.query;
  // dynamic where builder
  const query = knex('products').where(builder => {
    if (category) builder.where('category_id', category);
    if (maxPrice) builder.where('price', '<=', maxPrice);
  });
  const products = await query;
  res.json(products);
});

// internal endpoint for gateway to create product
app.post('/internal/products', async (req, res, next) => {
  try {
    const [id] = await knex('products').insert(req.body).returning('id');
    res.status(201).json({ id });
  } catch (err) { next(err); }
});

// rollback endpoint
app.delete('/internal/products/:id', async (req, res) => {
  await knex('products').where('id', req.params.id).del();
  res.sendStatus(204);
});

// INVENTORY (PG DRIVER)
// native pg driver, parameterized queries ($1, $2)
app.patch('/inventory/:sku', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    // use parameterized query for safety
    await pgPool.query(
      'UPDATE products SET stock = stock - $1 WHERE sku = $2',
      [quantity, req.params.sku]
    );
    res.sendStatus(204);
  } catch (err) {
    next(err); // pass to pgErrorMap
  }
});

// SERVER-SIDE CART (SEQUELIZE)

// eager loading (include)
app.get('/cart/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.params.userId, status: 'OPEN' },
      include: [CartLine] // eager loading implementation
    });
    if (!cart) return res.status(404).json({ error: 'cart not found' });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// sync cart items to server state
app.post('/cart/:userId/sync', async (req, res) => {
  const { items } = req.body;
  try {
    // managed transaction
    await sequelize.transaction(async (t) => {
      let cart = await Cart.findOne({ where: { userId: req.params.userId, status: 'OPEN' }, transaction: t });
      if (!cart) cart = await Cart.create({ userId: req.params.userId }, { transaction: t });
      
      // clear old state
      await CartLine.destroy({ where: { CartId: cart.id }, transaction: t });
      let total = 0;
      
      for (const item of items) {
        total += item.price * item.quantity;
        // safely extract number from frontend IDs (e.g. "p001" -> 1)
        const numericId = parseInt(String(item.productId).replace(/\D/g, '')) || 1;
        
        await CartLine.create({
          CartId: cart.id,
          productId: numericId,
          quantity: item.quantity,
          priceAtEntry: item.price // price snapshot in cart
        }, { transaction: t });
      }
      cart.totalPrice = total;
      await cart.save({ transaction: t });
    });
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ORDERS AND CHECKOUT SAGA (PRISMA)
// checkout with lock and oversell protection
app.post('/checkout', async (req, res) => {
  const { userId, items } = req.body;
  try {
    // prisma interactive transaction quarantees atomicity
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderLinesData = [];
      
      // oversell check and stock deduction
      for (const item of items) {
        const numericId = parseInt(String(item.productId).replace(/\D/g, '')) || 1;
        
        // use raw query to lock the row for update to prevent race conditions
        const [product] = await tx.$queryRaw`SELECT sku, stock, price FROM products WHERE id = ${numericId} FOR UPDATE`;
        
        if (!product || product.stock < item.quantity) {
          throw new Error('409_CONFLICT_OVERSELL');
        }
        
        // reduce stock
        await tx.$executeRaw`UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${numericId}`;
        totalAmount += Number(product.price) * item.quantity;

        orderLinesData.push({
          sku: product.sku,
          quantity: item.quantity,
          price: item.price
        });
      }

      // create order and snapshot price
      const newOrder = await tx.order.create({
        data: {
          totalAmount,
          status: 'PAID',
          lines: {
            create: orderLinesData
          }
        }
      });
      
      // mark cart as closed
      await Cart.update({ status: 'CLOSED' }, { where: { userId, status: 'OPEN' }});
      
      return newOrder;
    });

    res.status(201).json({ orderId: order.id });
  } catch (err) {
    if (err.message.includes('409')) return res.status(409).json({ error: 'conflict_oversell' });
    res.status(500).json({ error: err.message });
  }
});

// order cancellation and stock rollback
app.post('/orders/:id/cancel', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { lines: true } });
      if (!order) throw new Error('not_found');
      
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' }});
      
      // return stock to inventory
      for (const line of order.lines) {
        await tx.$executeRaw`UPDATE products SET stock = stock + ${line.quantity} WHERE sku = ${line.sku}`;
      }
    });
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// prisma $queryRaw (tagged template)
app.get('/analytics/orders-report', async (req, res) => {
  try {
    // reporting using raw SQL
    const report = await prisma.$queryRaw`
      SELECT 
        COUNT("id") as "totalOrders", 
        SUM("totalAmount") as "revenue" 
      FROM "Order"
    `;

    // parse BigInt to standard JavaScript Number for JSON serialization
    const formattedReport = report.map(row => ({
      totalOrders: Number(row.totalOrders),
      revenue: Number(row.revenue)
    }));

    res.json(formattedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// global error handler
app.use(pgErrorMap);

const PORT = process.env.PORT || 3001;

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`inventory service running on port ${PORT}`));
});