require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const items = await db.collection('menuitems').find({ 'ratings.0': { $exists: true } }).toArray();

  const customerNames = [
    'Tanvir Rahman',
    'Nusrat Jahan',
    'Arafat Hossain',
    'Sadia Islam',
    'Rahim Chowdhury',
    'Mehedi Hasan',
  ];

  let fixed = 0;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    let updated = false;
    const newRatings = (item.ratings || []).map((r, rIdx) => {
      if (!r.userName) {
        updated = true;
        return {
          ...r,
          userName: customerNames[(idx + rIdx) % customerNames.length],
          userImage: '',
          verifiedPurchase: true,
        };
      }
      return r;
    });

    if (updated) {
      await db.collection('menuitems').updateOne(
        { _id: item._id },
        { $set: { ratings: newRatings } }
      );
      fixed++;
    }
  }

  console.log(`✅ Fixed reviews on ${fixed} menu items`);
  await client.close();
}
fix().catch(console.error);
