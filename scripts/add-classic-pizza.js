require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');

  const mario = await db.collection('user').findOne({ email: 'mario@pizzahub.com' });
  const marioId = mario?._id?.toString() || 'mario_vendor';

  // Check if already exists
  const existing = await db.collection('menuitems').findOne({ name: 'Four-Cheese Garlic Pizza' });
  if (existing) {
    console.log('Four-Cheese Garlic Pizza already exists.');
    await client.close();
    return;
  }

  const res = await db.collection('menuitems').insertOne({
    name: 'Four-Cheese Garlic Pizza',
    itemName: 'Four-Cheese Garlic Pizza',
    category: 'Classic Pizzas',
    description: 'Thin-crust pizza loaded with mozzarella, cheddar, parmesan, and gouda, finished with golden roasted garlic and fresh herbs. Rich, gooey, and utterly satisfying.',
    price: 390,
    location: 'Dhaka',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'],
    vendorId: marioId,
    vendorName: "Mario's Pizzeria",
    status: 'approved',
    isActive: true,
    isVegetarian: true,
    ratings: [
      {
        userId: 'u20',
        userName: 'Kamrul Hasan',
        rating: 5,
        review: 'Four cheeses with garlic — absolutely divine!',
        verifiedPurchase: true,
        createdAt: new Date()
      }
    ],
    averageRating: 5,
    rating: 5,
    reviewCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Inserted Four-Cheese Garlic Pizza:', res.insertedId);

  // Print final breakdown
  const all = await db.collection('menuitems').find({ status: 'approved' }).toArray();
  const cats = {};
  all.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  console.log('\nFinal approved items:');
  Object.entries(cats).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));
  console.log('Total:', all.length);

  await client.close();
}

main().catch(console.error);
