require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const result = await db.collection('user').updateOne(
    { email: 'aniksahreyar@gmail.com' },
    { $set: { role: 'admin', subscriptionPlan: 'premium', isBlocked: false } }
  );
  console.log('Modified:', result.modifiedCount);
  const user = await db.collection('user').findOne({ email: 'aniksahreyar@gmail.com' });
  console.log('Email:', user.email, '| Role:', user.role);
  await client.close();
}
main().catch(console.error);
