const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// simple healthcheck endpoint 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// service urls from docker network
const INVENTORY_SERVICE = 'http://pg-service:3001';
const CATALOG_SERVICE = 'http://mongo-service:3002';

// hybrid product creation with bulletproof compensation (saga)
app.post('/api/products', async (req, res) => {
  const { name, sku, price, category_id, long_description, specs } = req.body;
  let createdProductId = null;

  try {
    // step 1: save main data to postgres
    const pgRes = await axios.post(`${INVENTORY_SERVICE}/internal/products`, {
      name, sku, price, category_id
    });
    
    createdProductId = typeof pgRes.data.id === 'object' 
    ? pgRes.data.id.id 
    : pgRes.data.id;

    // step 2: save extended details to mongodb
    await axios.post(`${CATALOG_SERVICE}/internal/product-details`, {
      productId: createdProductId,
      longDescription: long_description,
      specs
    });

    res.status(201).json({ id: createdProductId, message: 'product created in both databases' });
  } catch (error) {
    let rollbackStatus = 'not_attempted';

    // robust compensation logic if second save fails
    if (createdProductId) {
      try {
        // rollback: delete from postgres
        await axios.delete(`${INVENTORY_SERVICE}/internal/products/${createdProductId}`);
        rollbackStatus = 'success';
      } catch (rbError) {
        rollbackStatus = 'failed';
        console.error('rollback failed:', rbError.message);
      }
    }
    
    // standardized error format
    res.status(error.response?.status || 500).json({
      error: 'hybrid_transaction_failed',
      code: 500,
      details: error.response?.data || error.message,
      rollback_status: rollbackStatus
    });
  }
});

// routing for catalog
app.get('/api/products', (req, res) => {
  const params = new URLSearchParams(req.query).toString();
  axios.get(`${INVENTORY_SERVICE}/products?${params}`)
    .then(r => res.json(r.data)).catch(e => res.status(500).send(e.message));
});

// checkout proxy with hybrid event
app.post('/api/checkout', async (req, res) => {
  try {
    const pgRes = await axios.post(`${INVENTORY_SERVICE}/checkout`, req.body);
    // log completion event to mongo after successful pg checkout
    await axios.post(`${CATALOG_SERVICE}/telemetry/event`, {
      action: 'completed',
      userId: req.body.userId,
      details: { orderId: pgRes.data.id }
    });
    res.json(pgRes.data);
  } catch (error) {
    res.status(400).json({ error: 'checkout_failed', details: error.response?.data });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`api gateway listening on port ${PORT}`));