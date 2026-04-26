const express = require('express');
const axios = require('axios');
const app = express();

// allow CORS for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// service urls from docker network
const INVENTORY_SERVICE = 'http://pg-service:3001';
const CATALOG_SERVICE = 'http://mongo-service:3002';

// helper for standardized errors
const handleError = (res, err, defaultError = 'gateway_error') => {
  res.status(err.response?.status || 500).json({
    error: defaultError,
    code: err.response?.status || 500,
    details: err.response?.data || err.message
  });
};

// hybrid product creation saga with compensation
app.post('/api/products', async (req, res) => {
  const { name, sku, price, category_id, long_description, specs } = req.body;
  let createdProductId = null;

  try {
    // step 1: save to postgres
    const pgRes = await axios.post(`${INVENTORY_SERVICE}/internal/products`, { name, sku, price, category_id });
    createdProductId = typeof pgRes.data.id === 'object' ? pgRes.data.id.id : pgRes.data.id;

    // step 2: save details to mongo
    await axios.post(`${CATALOG_SERVICE}/internal/product-details`, {
      productId: createdProductId, longDescription: long_description, specs
    });

    res.status(201).json({ id: createdProductId, message: 'product created in both databases' });
  } catch (error) {
    let rollbackStatus = 'not_attempted';
    
    // compensation: delete from postgres if mongo fails
    if (createdProductId) {
      try {
        await axios.delete(`${INVENTORY_SERVICE}/internal/products/${createdProductId}`);
        rollbackStatus = 'success';
      } catch (rbError) { 
        rollbackStatus = 'failed'; 
      }
    }
    
    res.status(500).json({
      error: 'hybrid_transaction_failed', code: 500, details: error.message, rollback_status: rollbackStatus
    });
  }
});

// dynamic catalog routing
app.get('/api/products', (req, res) => {
  const params = new URLSearchParams(req.query).toString();
  axios.get(`${INVENTORY_SERVICE}/products?${params}`).then(r => res.json(r.data)).catch(e => handleError(res, e));
});

// get server cart state
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const r = await axios.get(`${INVENTORY_SERVICE}/cart/${req.params.userId}`);
    res.json(r.data);
  } catch (e) {
    if (e.response?.status === 404) return res.json({ lines: [], totalPrice: 0 }); 
    handleError(res, e);
  }
});

// sync entire cart state from frontend to backend
app.post('/api/cart/:userId/sync', async (req, res) => {
  try {
    const { items } = req.body;
    await axios.post(`${INVENTORY_SERVICE}/cart/${req.params.userId}/sync`, { items });
    
    // save cart draft in mongo for analytics (fire and forget)
    axios.post(`${CATALOG_SERVICE}/cart-draft/${req.params.userId}/add`, { items }).catch(() => {});
    
    res.sendStatus(200);
  } catch (e) { handleError(res, e); }
});

// checkout proxy with oversell check and hybrid event
app.post('/api/checkout', async (req, res) => {
  const { userId, items } = req.body;
  let orderId = null;

  try {
    // step 1: transaction in postgres (price snapshot, reduce stock)
    const pgRes = await axios.post(`${INVENTORY_SERVICE}/checkout`, { userId, items });
    orderId = pgRes.data.orderId;

    // step 2: close draft in mongo
    await axios.post(`${CATALOG_SERVICE}/telemetry/event`, {
      action: 'checkout_completed', userId, details: `order_${orderId}`
    });

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    // oversell will throw 409 from inventory service
    handleError(res, error, 'checkout_failed');
  }
});

// cancel order and return stock
app.post('/api/orders/:orderId/cancel', async (req, res) => {
  axios.post(`${INVENTORY_SERVICE}/orders/${req.params.orderId}/cancel`)
    .then(() => res.sendStatus(200)).catch(e => handleError(res, e));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`api gateway listening on port ${PORT}`));