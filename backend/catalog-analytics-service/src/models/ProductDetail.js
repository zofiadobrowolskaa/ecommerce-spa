const mongoose = require('mongoose');

// nested schema for product variants (no separate _id per variant)
const variantSchema = new mongoose.Schema({
  id: String,
  color: String,
  priceAdjustment: Number,
  imageUrl: String,
  size: [String],
  stock: Number,
  sku: String
}, { _id: false }); // disable auto _id for embedded documents

// schema for extended product information (catalog layer)
const productDetailSchema = new mongoose.Schema({
  productId: { type: Number, required: true, unique: true },

  // extended description beyond base product (Postgres)
  longDescription: String,

  // flexible key-value specs (e.g. material, weight)
  specs: { type: Map, of: String },

  // image gallery for product
  gallery: [String],

  // additional descriptive sections (e.g. materials, care)
  // changed to Mixed to allow flexible nested structures (fixes missing/ignored fields)
  aboutMaterials: mongoose.Schema.Types.Mixed,

  // list of variants (color/size/stock/price adjustments)
  variants: [variantSchema]
});

module.exports = mongoose.model('ProductDetail', productDetailSchema);