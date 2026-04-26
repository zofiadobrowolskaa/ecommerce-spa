const express = require('express');
const { connectMongo, getDb } = require('./db/mongoClient');
const connectMongoose = require('./db/mongoose');
const ProductDetail = require('./models/ProductDetail');
const Review = require('./models/Review');

const app = express();
app.use(express.json());

// telemetry event log endpoint (native driver with 3 operators)
app.post('/telemetry/event', async (req, res) => {
  try {
    const db = getDb();
    const { action, userId, details } = req.body;

    // update document with 3 distinct operators
    const result = await db.collection('event_log').updateOne(
      { userId },
      {
        $push: { events: { action, details, timestamp: new Date() } }, // op 1: push to array
        $inc: { eventCount: 1 },                                       // op 2: increment counter
        $set: { lastAction: action }                                   // op 3: set field
      },
      { upsert: true } // create if doesn't exist
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// cart draft operations
app.post('/cart-draft/:sessionId/add', async (req, res) => {
  try {
    const db = getDb();
    const { sessionId } = req.params;
    const { productId, variant, price } = req.body;

    const result = await db.collection('cart_draft').updateOne(
      { sessionId },
      {
        $set: { lastModified: new Date() },
        $push: { items: { productId, variant, price, addedAt: new Date() } },
        $inc: { totalItems: 1 }
      },
      { upsert: true }
    );
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add new review
app.post('/reviews', async (req, res) => {
  try {
    const review = new Review(req.body);
    // save triggers mongoose custom validators and pre-hooks
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// populate review with product details
app.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId, status: 'APPROVED' });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// analytical endpoint using aggregation pipeline
app.get('/analytics/average-ratings', async (req, res) => {
  try {
    const report = await Review.aggregate([
      // stage 1: match approved reviews (uses index)
      { $match: { status: 'APPROVED' } },
      
      // stage 2: group by product and calculate average
      { $group: { 
          _id: "$productId", 
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
      } },
      
      // stage 3: join with product details
      { $lookup: {
          from: "productdetails",
          localField: "_id",
          foreignField: "productId",
          as: "details"
      } },
      
      // unwind array from lookup to format correctly
      { $unwind: "$details" },
      
      // stage 4: project final format
      { $project: {
          _id: 0,
          productId: "$_id",
          avgRating: { $round: ["$avgRating", 1] },
          reviewCount: 1,
          productName: "$details.longDescription"
      } }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// dummy data setup for testing
app.post('/test/setup', async (req, res) => {
  try {
    // clear existing test data to prevent duplicate key errors
    await ProductDetail.deleteMany({ productId: 1 });
    await Review.deleteMany({ productId: 1 });

    await ProductDetail.create({ productId: 1, longDescription: "Golden Necklace", specs: { material: "Gold" } });
    await Review.create({ productId: 1, userId: "u1", rating: 5, status: "APPROVED", title: "Great", body: "Awesome" });
    await Review.create({ productId: 1, userId: "u2", rating: 4, status: "APPROVED", title: "Nice", body: "Good" });
    res.send("test data created successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// internal endpoint
app.post('/internal/product-details', async (req, res) => {
  try {
    const detail = new ProductDetail(req.body);
    await detail.save();
    res.status(201).json(detail);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

// init both drivers before starting app
Promise.all([connectMongo(), connectMongoose()]).then(() => {
  app.listen(PORT, () => console.log(`catalog service running on ${PORT}`));
});