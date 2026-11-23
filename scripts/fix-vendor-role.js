require('dotenv').config({ path: 'c:/Projects/assignment 9/pizzahub-server/.env' });
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db('pizzahub').collection('user');

  // Fix all accounts that were registered as vendor but saved with role: customer
  // These are the known test accounts — fix both Backup 7 and backup 8
  const toFix = [
    { email: 'backk6upp@gmail.com', role: 'vendor' },   // Backup 7
    { email: 'bacup808@gmail.com',  role: 'vendor' },   // backup 8
  ];

  for (const { email, role } of toFix) {
    const r = await col.updateOne({ email }, { $set: { role } });
    const u = await col.findOne({ email });
    console.log(`${u.name} (${email}): ${r.modifiedCount ? '✅ Fixed' : '⚠️ No change'} → ${u.role}`);
  }

  await client.close();
}

fix().catch(console.error);
