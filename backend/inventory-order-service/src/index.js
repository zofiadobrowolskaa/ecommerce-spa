const express = require('express');
const knex = require('knex')(require('../knexfile').development);
const { sequelize, Cart, CartLine } = require('./db/sequelize');
const pgPool = require('./db/pgPool');
const pgErrorMap = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());

// knex: dynamic filtering endpoint
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

// sequelize: checkout with managed transaction
app.post('/cart/checkout', async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // business logic inside transaction
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// pg: inventory update with parameterized query
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

app.use(pgErrorMap);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`inventory service running on ${PORT}`));