const { z } = require('zod');

// input validation schemas to protect databases
const productSchema = z.object({
  name: z.string().min(1, 'name is required'),
  sku: z.string().min(1, 'sku is required'),
  price: z.number().positive('price must be positive'),
  category_id: z.number().int().positive('category_id must be valid'),
  long_description: z.string().optional(),
  specs: z.record(z.any()).optional()
});

const cartSyncSchema = z.object({
  items: z.array(z.object({
    productId: z.union([z.string(), z.number()]),
    quantity: z.number().int().positive('quantity must be positive'),
    price: z.number().nonnegative('price cannot be negative')
  }))
});

const checkoutSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  items: z.array(z.object({
    productId: z.union([z.string(), z.number()]),
    quantity: z.number().int().positive('quantity must be positive'),
    price: z.number().nonnegative('price cannot be negative')
  })).min(1, 'cart cannot be empty')
});

// generic validation middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    // return safe, standardized 400 error without leaking server state
    res.status(400).json({ error: 'validation_error', code: 400, details: err.errors });
  }
};

module.exports = { productSchema, cartSyncSchema, checkoutSchema, validate };