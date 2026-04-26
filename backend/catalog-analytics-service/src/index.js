const express = require('express');
const { connectMongo } = require('./db/mongoClient');

const app = express();
app.use(express.json());

// telemetry event log endpoint (native driver)
app.post('/telemetry/event', async (req, res) => {
  try {
    const db = await connectMongo();
    const { action, userId, details } = req.body;

    // insert single event document
    const result = await db.collection('event_log').insertOne({
      action,
      userId,
      details,
      timestamp: new Date()
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// cart draft operations using $set, $push, $inc
app.post('/cart-draft/:sessionId/add', async (req, res) => {
  try {
    const db = await connectMongo();
    const { sessionId } = req.params;
    const { productId, variant, price } = req.body;

    // upsert cart draft with 3 distinct operators
    const result = await db.collection('cart_draft').updateOne(
      { sessionId },
      {
        $set: { lastModified: new Date() }, // updates timestamp
        $push: { items: { productId, variant, price, addedAt: new Date() } }, // appends to array
        $inc: { totalItems: 1 } // increments counter
      },
      { upsert: true } // create if doesn't exist
    );

    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

// initialize db before listening
connectMongo().then(() => {
  app.listen(PORT, () => console.log(`catalog service running on ${PORT}`));
}).catch(console.error);