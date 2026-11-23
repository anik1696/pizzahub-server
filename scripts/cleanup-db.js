require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const col = db.collection('menuitems');

  // Delete both Garlic Cheese Pizza duplicates (no image, one rejected one approved test item)
  const deleteRes = await col.deleteMany({
    _id: {
      $in: [
        new ObjectId('6b045d67f0486c1a0e81416c'),
        new ObjectId('6b045dd6f0486c1a0e81416d'),
      ]
    }
  });
  console.log(`Deleted ${deleteRes.deletedCount} duplicate Garlic Cheese Pizza item(s).`);

  // Also fix the Borhani & Mango Lassi Combo — ensure the image is NOT a burger
  // The current image should be the mango lassi one already, but let's force it
  const lassiRes = await col.updateMany(
    { $or: [{ name: /Borhani.*Lassi/i }, { itemName: /Borhani.*Lassi/i }] },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80',
        images: ['https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80'],
      }
    }
  );
  console.log(`Re-applied mango lassi image: ${lassiRes.modifiedCount} item(s).`);

  // Print final category breakdown
  const all = await col.find({ status: 'approved' }).toArray();
  const cats = {};
  all.forEach(i => {
    cats[i.category] = (cats[i.category] || 0) + 1;
  });
  console.log('\nFinal approved items per category:');
  Object.entries(cats).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));
  console.log('Total approved:', all.length);

  await client.close();
}

main().catch(console.error);
