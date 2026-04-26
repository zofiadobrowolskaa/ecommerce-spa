const mongoose = require('mongoose');

// sub-schema for nested image gallery
const reviewImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: String
});

const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true, index: true }, // indexed for performance
  userId: { type: String, required: true },
  // custom validator for rating scale
  rating: { 
    type: Number, 
    required: true, 
    min: [1, 'rating must be at least 1'], 
    max: [5, 'rating cannot exceed 5'] 
  },
  title: String,
  body: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  // nested sub-documents array
  gallery: [reviewImageSchema],
  updatedAt: { type: Date, default: Date.now }
});

// pre-hook to update modification date
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Review', reviewSchema);