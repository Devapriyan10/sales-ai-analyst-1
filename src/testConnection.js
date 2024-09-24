const { MongoClient } = require('mongodb');

const uri = "mongodb://127.0.0.1:27017/sales-ai-analytics";

async function run() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected successfully to server");
    await client.close();
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);
