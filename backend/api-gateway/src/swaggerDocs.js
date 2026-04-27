// openapi 3.x specification contract
const swaggerDocument = {
  openapi: '3.0.0',
  info: { 
    title: 'E-commerce API Gateway', 
    version: '1.0.0', 
    description: 'REST Contract for Catalog, Cart, and Orders' 
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/api/products': {
      get: { 
        summary: 'Get product catalog', 
        responses: { 200: { description: 'List of products' } } 
      },
      post: { 
        summary: 'Create product (Saga)', 
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, sku: { type: 'string' }, price: { type: 'number' }, category_id: { type: 'number' } } } } } }, 
        responses: { 201: { description: 'Created' } } 
      }
    },
    '/api/cart/{userId}': {
      get: { summary: 'Get user cart state', responses: { 200: { description: 'Cart object' } } }
    },
    '/api/checkout': {
      post: { 
        summary: 'Process checkout', 
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' }, items: { type: 'array', items: { type: 'object' } } } } } } }, 
        responses: { 201: { description: 'Checkout successful' }, 409: { description: 'Oversell conflict' } } 
      }
    }
  }
};

module.exports = swaggerDocument;