const mongoose = require('mongoose');

// schema for extended product information
const productDetailSchema = new mongoose.Schema({
  productId: { type: Number, required: true, unique: true },
  longDescription: String,
  specs: { type: Map, of: String }, // dynamic map for product specifications
  gallery: [String] // array of image urls
});

module.exports = mongoose.model('ProductDetail', productDetailSchema);