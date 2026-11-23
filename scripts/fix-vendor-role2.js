require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');

  // Fix ytxpremium1111 — registered as vendor but saved as customer
  const r1 = await db.collection('user').updateOne(
    { email: 'ytxpremium1111@gmail.com' },
    { $set: { role: 'vendor', businessName: 'YT Premium Pizzeria' } }
  );
  console.log('ytxpremium1111 fixed:', r1.modifiedCount, 'doc updated');

  // Also check/fix other recently-registered accounts that should be vendors
  const allUsers = await db.collection('user').find({}).toArray();
  console.log('\nAll users:');
  allUsers.forEach(u => console.log(` - ${u.email}: role=${u.role}`));

  await client.close();
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
