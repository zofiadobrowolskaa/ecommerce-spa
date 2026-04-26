const { MongoClient } = require('mongodb');

// connection uri fallback
const uri = process.env.MONGO_URI || 'mongodb://admin:password@mongodb:27017';
const client = new MongoClient(uri);

let dbInstance = null;

// singleton pattern for db connection
async function connectMongo() {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db('ecommerce_mongo');
    console.log('connected to mongodb via native driver');

    // create text index for searching logs
    await dbInstance.collection('event_log').createIndex({ details: "text", action: "text" });
    
    // create index for quick draft cart lookups
    await dbInstance.collection('cart_draft').createIndex({ sessionId: 1 }, { unique: true });
  }
  return dbInstance;
}

// graceful shutdown on sigint
process.on('SIGINT', async () => {
  console.log('sigint received: closing mongodb connection');
  await client.close();
  process.exit(0);
});

module.exports = { connectMongo, client };