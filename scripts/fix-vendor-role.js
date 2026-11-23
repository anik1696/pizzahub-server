require('dotenv').config({ path: 'c:/Projects/assignment 9/pizzahub-server/.env' });
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db('pizzahub').collection('user');

  const result = await col.updateOne(
    { email: 'aniksahreyar11@gmail.com' },
    { $set: { role: 'vendor' } }
  );
  console.log('Modified:', result.modifiedCount);

  const u = await col.findOne({ email: 'aniksahreyar11@gmail.com' });
  console.log('Role now:', u.email, '->', u.role);
  await client.close();
}

fix().catch(console.error);
