require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const items = await db.collection('menuitems').find({ itemName: { $exists: false } }).toArray();
  console.log('Items missing itemName:', items.length);
  for (const item of items) {
    if (item.name) {
      await db.collection('menuitems').updateOne({ _id: item._id }, { $set: { itemName: item.name } });
    }
  }
  console.log('Fixed items without itemName');
  await client.close();
}
fix().catch(console.error);
