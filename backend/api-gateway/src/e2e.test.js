const request = require('supertest');

// target the running api gateway
const API_URL = 'http://localhost:3000';

describe('e2e critical paths', () => {
  const testUserId = 'u1';
  const testProductId = 1; // assumes product 1 exists
  let initialStock = 0;
  let createdOrderId = null;

  it('step 1: should fetch initial stockk', async () => {
    const res = await request(API_URL).get('/api/products');
    expect(res.status).toBe(200);
    
    const product = res.body.find(p => p.id === testProductId);
    expect(product).toBeDefined();
    initialStock = product.stock;
  });

  it('step 2: should block overselling with 409 conflict', async () => {
    const payload = { 
      userId: testUserId, 
      items: [{ productId: testProductId, quantity: 9999, price: 120 }] 
    };
    
    const res = await request(API_URL).post('/api/checkout').send(payload);
    expect(res.status).toBe(409); 
  });

  it('step 3: should process valid checkout successfully', async () => {
    const payload = { 
      userId: testUserId, 
      items: [{ productId: testProductId, quantity: 1, price: 120 }] 
    };
    
    const res = await request(API_URL).post('/api/checkout').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdOrderId = res.body.orderId;
  });

  it('step 4: should verify inventory stock was strictly reduced', async () => {
    const res = await request(API_URL).get('/api/products');
    const product = res.body.find(p => p.id === testProductId);
    
    expect(product.stock).toBe(initialStock - 1);
  });

  it('step 5: should restore stock on order cancellation', async () => {
    const cancelRes = await request(API_URL).post(`/api/orders/${createdOrderId}/cancel`);
    expect(cancelRes.status).toBe(200);

    const res = await request(API_URL).get('/api/products');
    const product = res.body.find(p => p.id === testProductId);
    
    expect(product.stock).toBe(initialStock); 
  });

  it('step 6: should successfully execute hybrid product creation saga', async () => {
    const payload = {
      name: "e2e test necklace",
      sku: `E2E-${Date.now()}`, // unique sku
      price: 150,
      category_id: 1,
      long_description: "beautiful e2e testing necklace",
      specs: { material: "silver" }
    };
    
    const res = await request(API_URL).post('/api/products').send(payload);
    // expect successful creation in both databases
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('step 7: should block invalid product data using zod validation', async () => {
    const invalidPayload = {
      name: "", // empty name
      sku: "E2E-INVALID",
      price: -50 // invalid negative price
    };
    
    const res = await request(API_URL).post('/api/products').send(invalidPayload);
    // expect gateway to return 400 bad request safely
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });
});