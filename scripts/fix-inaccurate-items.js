require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const col = db.collection('menuitems');

  console.log('🔄 Updating inaccurate images in MongoDB...');

  // 1. Fix "Borhani & Mango Lassi Combo" (was burger, now mango lassi drink)
  const lassiRes = await col.updateMany(
    { $or: [{ itemName: /Borhani & Mango Lassi/i }, { name: /Borhani & Mango Lassi/i }] },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80',
        images: ['https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80'],
      }
    }
  );
  console.log(`  Updated Borhani & Mango Lassi: ${lassiRes.modifiedCount} item(s)`);

  // 2. Fix "Spicy Buffalo Chicken" (was burger, now spicy buffalo pizza)
  const buffaloRes = await col.updateMany(
    { $or: [{ itemName: /Spicy Buffalo Chicken/i }, { name: /Spicy Buffalo Chicken/i }] },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80',
        images: ['https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'],
      }
    }
  );
  console.log(`  Updated Spicy Buffalo Chicken: ${buffaloRes.modifiedCount} item(s)`);

  // 3. Fix "Deshi Garlic Naan Sticks" (ensure realistic garlic breadsticks)
  const naanRes = await col.updateMany(
    { $or: [{ itemName: /Deshi Garlic Naan Sticks/i }, { name: /Deshi Garlic Naan Sticks/i }] },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=600&q=80',
        images: ['https://images.unsplash.com/photo-1619895092538-128341789043?w=600&q=80'],
      }
    }
  );
  console.log(`  Updated Deshi Garlic Naan Sticks: ${naanRes.modifiedCount} item(s)`);

  // 4. Add rich, realistic items to "Beverages & Desserts" and "Sides & Appetizers" if they don't exist
  const mario = await db.collection('user').findOne({ email: 'mario@pizzahub.com' });
  const bella = await db.collection('user').findOne({ email: 'bella@pizzahub.com' });
  const marioId = mario?._id?.toString() || 'mario_vendor';
  const bellaId = bella?._id?.toString() || 'bella_vendor';

  const extraItems = [
    {
      name: 'Chilled Mint Borhani',
      itemName: 'Chilled Mint Borhani',
      category: 'Beverages & Desserts',
      description: 'Traditional Bangladeshi spiced yoghurt drink blended with fresh mint, coriander, roasted cumin, and black salt. Served chilled — the ultimate digestive companion to any pizza.',
      price: 120,
      location: 'Dhaka',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80'],
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u11', userName: 'Rahim Chowdhury', rating: 5, review: 'Best borhani in Dhaka, perfectly spiced!', verifiedPurchase: true, createdAt: new Date() }],
      averageRating: 5,
      rating: 5,
      reviewCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Warm Chocolate Lava Cake',
      itemName: 'Warm Chocolate Lava Cake',
      category: 'Beverages & Desserts',
      description: 'Decadent dark chocolate sponge cake baked to order with a luscious molten chocolate fudge center. Dusted with powdered sugar and cocoa.',
      price: 220,
      location: 'Chittagong',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80'],
      vendorId: bellaId,
      vendorName: 'Bella Roma',
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u12', userName: 'Sadia Islam', rating: 5, review: 'The molten center is heavenly!', verifiedPurchase: true, createdAt: new Date() }],
      averageRating: 5,
      rating: 5,
      reviewCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Spicy BBQ Chicken Wings (6 Pcs)',
      itemName: 'Spicy BBQ Chicken Wings (6 Pcs)',
      category: 'Sides & Appetizers',
      description: 'Six crispy fried chicken wings glazed with smoky barbecue sauce and hot desi chilli flakes. Served with homemade garlic dipping sauce.',
      price: 280,
      location: 'Dhaka',
      image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80'],
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u13', userName: 'Mehedi Hasan', rating: 5, review: 'Super crispy and well-sauced!', verifiedPurchase: true, createdAt: new Date() }],
      averageRating: 5,
      rating: 5,
      reviewCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Crispy Mozzarella Cheese Sticks',
      itemName: 'Crispy Mozzarella Cheese Sticks',
      category: 'Sides & Appetizers',
      description: 'Golden-crumbed melted mozzarella sticks seasoned with Italian oregano and garlic. Served with a tangy marinara dip.',
      price: 220,
      location: 'Sylhet',
      image: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=80'],
      vendorId: bellaId,
      vendorName: 'Bella Roma',
      status: 'approved',
      isActive: true,
      ratings: [{ userId: 'u14', userName: 'Tanvir Rahman', rating: 5, review: 'Great cheese pull and crunchy breading.', verifiedPurchase: true, createdAt: new Date() }],
      averageRating: 5,
      rating: 5,
      reviewCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const item of extraItems) {
    const existing = await col.findOne({ $or: [{ itemName: item.itemName }, { name: item.name }] });
    if (!existing) {
      await col.insertOne(item);
      console.log(`  Added new item: ${item.itemName} (${item.category})`);
    } else {
      console.log(`  Item already exists: ${item.itemName}`);
    }
  }

  console.log('\n📊 Category breakdown:');
  const cats = [
    'Classic Pizzas',
    'Vegetarian Pizzas',
    'Meat Lovers',
    'Specialty / Gourmet Pizzas',
    'Sides & Appetizers',
    'Beverages & Desserts',
  ];
  for (const c of cats) {
    const count = await col.countDocuments({ category: c, status: 'approved' });
    console.log(`  ${c}: ${count} items`);
  }

  await client.close();
}
fix().catch(console.error);
