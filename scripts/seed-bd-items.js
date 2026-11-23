require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');

  const mario = await db.collection('user').findOne({ email: 'mario@pizzahub.com' });
  const bella = await db.collection('user').findOne({ email: 'bella@pizzahub.com' });
  const marioId = mario._id.toString();
  const bellaId = bella._id.toString();
  console.log('Mario ID:', marioId);
  console.log('Bella  ID:', bellaId);

  // Check existing items by the 6 valid categories
  const validCategories = [
    'Classic Pizzas',
    'Vegetarian Pizzas',
    'Meat Lovers',
    'Specialty / Gourmet Pizzas',
    'Sides & Appetizers',
    'Beverages & Desserts',
  ];

  for (const cat of validCategories) {
    const count = await db.collection('menuitems').countDocuments({ category: cat, status: 'approved' });
    console.log(`  ${cat}: ${count} approved items`);
  }

  // ── NEW ITEMS to add (Bangladesh context, 1 per missing/thin category) ──
  const now = new Date();
  const newItems = [
    // Classic Pizzas — BD style
    {
      name: 'Deshi Cheese Pizza',
      category: 'Classic Pizzas',
      description: 'A Bangladeshi take on the classic — thin crust topped with mozzarella, fresh tomato sauce, and a sprinkle of black pepper. Simple, satisfying, and crowd-pleasing.',
      price: 450,
      location: 'Dhaka',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
      images: [],
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u1', rating: 4, review: 'Great simple pizza!', createdAt: now }],
      averageRating: 4,
      createdAt: now, updatedAt: now,
    },
    // Vegetarian Pizzas
    {
      name: 'Deshi Veggie Delight',
      category: 'Vegetarian Pizzas',
      description: 'Loaded with fresh capsicum, red onion, tomato, mushroom, and corn on a herb-infused tomato base. A vegetarian feast inspired by Bangladeshi market-fresh produce.',
      price: 390,
      location: 'Chittagong',
      image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80',
      images: [],
      vendorId: bellaId,
      vendorName: 'Bella Roma',
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u2', rating: 5, review: 'Absolutely fresh and delicious!', createdAt: now }],
      averageRating: 5,
      createdAt: now, updatedAt: now,
    },
    // Meat Lovers
    {
      name: 'Bangladeshi Spicy Beef Pizza',
      category: 'Meat Lovers',
      description: 'Seasoned ground beef with green chilli, onion, and desi spices on a rich tomato base. A bold, spicy twist on the meat feast — perfect for those who love heat.',
      price: 620,
      location: 'Dhaka',
      image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
      images: [],
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u3', rating: 5, review: 'The spice level is perfect!', createdAt: now }],
      averageRating: 5,
      createdAt: now, updatedAt: now,
    },
    // Specialty / Gourmet Pizzas
    {
      name: 'Hilsa Bhuna Gourmet Pizza',
      category: 'Specialty / Gourmet Pizzas',
      description: 'A truly Bangladeshi gourmet experience — tender hilsa fish marinated in mustard-turmeric paste on a creamy white sauce base, garnished with fresh coriander.',
      price: 850,
      location: 'Sylhet',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
      images: [],
      vendorId: bellaId,
      vendorName: 'Bella Roma',
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u4', rating: 5, review: 'Never had anything like this — fusion masterpiece!', createdAt: now }],
      averageRating: 5,
      createdAt: now, updatedAt: now,
    },
    // Sides & Appetizers
    {
      name: 'Deshi Garlic Naan Sticks',
      category: 'Sides & Appetizers',
      description: 'Warm, buttery naan sticks brushed with garlic and herb butter, served with a side of spiced yoghurt dip. Pairs perfectly with any pizza or as a starter.',
      price: 180,
      location: 'Dhaka',
      image: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80',
      images: [],
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u5', rating: 4, review: 'Addictive dip!', createdAt: now }],
      averageRating: 4,
      createdAt: now, updatedAt: now,
    },
    // Beverages & Desserts
    {
      name: 'Borhani & Mango Lassi Combo',
      category: 'Beverages & Desserts',
      description: 'A refreshing Bangladeshi duo — chilled borhani (spiced yoghurt drink) paired with a sweet, creamy Rajshahi mango lassi. The perfect pairing with spicy pizza.',
      price: 150,
      location: 'Rajshahi',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
      images: [],
      vendorId: bellaId,
      vendorName: 'Bella Roma',
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u6', rating: 5, review: 'So refreshing with spicy pizza!', createdAt: now }],
      averageRating: 5,
      createdAt: now, updatedAt: now,
    },
  ];

  const result = await db.collection('menuitems').insertMany(newItems);
  console.log(`\n✅ Inserted ${result.insertedCount} new items`);

  // Final count
  console.log('\nFinal counts:');
  for (const cat of validCategories) {
    const count = await db.collection('menuitems').countDocuments({ category: cat, status: 'approved' });
    console.log(`  ${cat}: ${count} approved items`);
  }

  await client.close();
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
