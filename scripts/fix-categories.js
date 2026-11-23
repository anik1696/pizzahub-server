require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const col = db.collection('menuitems');

  // Map old wrong values → correct enum values
  const categoryMap = [
    { from: 'classic',    to: 'Classic Pizzas' },
    { from: 'vegetarian', to: 'Vegetarian Pizzas' },
    { from: 'vegan',      to: 'Vegetarian Pizzas' },
    { from: 'meat',       to: 'Meat Lovers' },
    { from: 'chicken',    to: 'Meat Lovers' },
    { from: 'gourmet',    to: 'Specialty / Gourmet Pizzas' },
    { from: 'spicy',      to: 'Specialty / Gourmet Pizzas' },
    { from: 'seafood',    to: 'Specialty / Gourmet Pizzas' },
    { from: 'sides',      to: 'Sides & Appetizers' },
    { from: 'beverages',  to: 'Beverages & Desserts' },
    { from: 'desserts',   to: 'Beverages & Desserts' },
  ];

  let totalFixed = 0;
  for (const { from, to } of categoryMap) {
    const res = await col.updateMany(
      { category: from },
      { $set: { category: to } }
    );
    if (res.modifiedCount > 0) {
      console.log(`  "${from}" → "${to}": ${res.modifiedCount} items fixed`);
      totalFixed += res.modifiedCount;
    }
  }

  console.log(`\n✅ Total fixed: ${totalFixed} items`);

  // Final category counts
  const validCategories = [
    'Classic Pizzas',
    'Vegetarian Pizzas',
    'Meat Lovers',
    'Specialty / Gourmet Pizzas',
    'Sides & Appetizers',
    'Beverages & Desserts',
  ];
  console.log('\nFinal counts (all statuses):');
  for (const cat of validCategories) {
    const count = await col.countDocuments({ category: cat });
    console.log(`  ${cat}: ${count} items`);
  }

  await client.close();
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
