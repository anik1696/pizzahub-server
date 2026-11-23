require('dotenv').config({ path: 'c:/Projects/assignment 9/pizzahub-server/.env' });
const { MongoClient } = require('mongodb');

const targetEmail = process.argv[2] || 'aniksahreyar@gmail.com';

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db('pizzahub').collection('user');

  const result = await col.updateOne(
    { email: targetEmail },
    { $set: { role: 'admin', subscriptionPlan: 'premium', isBlocked: false } }
  );
  console.log('Modified:', result.modifiedCount);

  const user = await col.findOne({ email: targetEmail });
  if (user) {
    console.log('✅ Done! Email:', user.email, '| Role:', user.role);
  } else {
    console.log('❌ User not found with email:', targetEmail);
  }
  await client.close();
}
main().catch(console.error);
