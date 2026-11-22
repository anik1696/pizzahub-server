const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;

const sampleVendors = [
  {
    _id: new ObjectId(),
    name: "Mario's Pizzeria",
    email: "mario@pizzahub.com",
    emailVerified: true,
    image: "https://i.pravatar.cc/150?img=11",
    role: "vendor",
    isBlocked: false,
    businessName: "Mario's Pizzeria",
    subscriptionPlan: "premium",
    subscriptionExpiresAt: "2027-12-31",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: "Bella Roma",
    email: "bella@pizzahub.com",
    emailVerified: true,
    image: "https://i.pravatar.cc/150?img=22",
    role: "vendor",
    isBlocked: false,
    businessName: "Bella Roma Kitchen",
    subscriptionPlan: "free",
    subscriptionExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const menuItems = [
  // Mario's Pizzeria items
  {
    name: "Margherita Classic",
    description: "Fresh tomato sauce, hand-stretched mozzarella, fragrant basil and a drizzle of olive oil on a crispy stone-baked crust. Simple, timeless, and absolutely delicious.",
    price: 350,
    category: "classic",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    ingredients: ["Tomato sauce", "Fresh mozzarella", "Basil", "Olive oil"],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 124,
    location: "Dhaka",
  },
  {
    name: "Pepperoni Supreme",
    description: "Loaded with generous slices of premium pepperoni, smoked mozzarella and tangy tomato sauce. The crowd favourite for a reason — order it once and you will keep coming back.",
    price: 480,
    category: "meat",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
    ingredients: ["Pepperoni", "Smoked mozzarella", "Tomato sauce", "Oregano"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 218,
    location: "Dhaka",
  },
  {
    name: "BBQ Chicken Ranch",
    description: "Tender grilled chicken, smoky BBQ sauce, red onions and a swirl of ranch dressing, finished with fresh coriander. A bold, satisfying combo that hits every time.",
    price: 520,
    category: "chicken",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    ingredients: ["Grilled chicken", "BBQ sauce", "Red onion", "Ranch dressing", "Coriander"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 89,
    location: "Chattogram",
  },
  {
    name: "Inferno Diavola",
    description: "Not for the faint-hearted. Spicy salami, fresh green chillies, jalapeños and fiery arrabbiata sauce — every bite packs serious heat. You have been warned.",
    price: 460,
    category: "spicy",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    ingredients: ["Spicy salami", "Green chillies", "Jalapeños", "Arrabbiata sauce", "Mozzarella"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: true,
    isAvailable: true,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 73,
    location: "Dhaka",
  },
  {
    name: "Garden Veggie Delight",
    description: "Roasted bell peppers, zucchini, sun-dried tomatoes, mushrooms and black olives on a herb-infused tomato base. Proof that vegetarian pizza never has to compromise on flavour.",
    price: 380,
    category: "vegetarian",
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80",
    ingredients: ["Bell peppers", "Zucchini", "Sun-dried tomatoes", "Mushrooms", "Black olives"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 56,
    location: "Sylhet",
  },
  {
    name: "Truffle Mushroom Gourmet",
    description: "Wild mushroom medley, truffle oil, parmesan shavings and crème fraîche on a white garlic base. Rich, earthy and indulgent — a true gourmet experience.",
    price: 650,
    category: "gourmet",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&q=80",
    ingredients: ["Wild mushrooms", "Truffle oil", "Parmesan", "Crème fraîche", "Garlic"],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 102,
    location: "Dhaka",
  },
  // Bella Roma items
  {
    name: "Quattro Formaggi",
    description: "Four premium Italian cheeses — mozzarella, gorgonzola, fontina and pecorino — melted together on a thin crispy base. A cheese lover's dream that never disappoints.",
    price: 580,
    category: "classic",
    image: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=600&q=80",
    ingredients: ["Mozzarella", "Gorgonzola", "Fontina", "Pecorino"],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 94,
    location: "Dhaka",
  },
  {
    name: "Prosciutto Gourmet",
    description: "Thinly sliced premium prosciutto on a mozzarella base, topped with fresh rocket leaves and shaved parmesan after baking. Elegant, light and incredibly satisfying.",
    price: 680,
    category: "gourmet",
    image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80",
    ingredients: ["Prosciutto", "Mozzarella", "Rocket leaves", "Parmesan", "Lemon zest"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 137,
    location: "Chattogram",
  },
  {
    name: "Spicy Buffalo Chicken",
    description: "Crispy buffalo-style chicken, blue cheese drizzle, celery and hot sauce on a creamy base, finished with spring onions. Wings and pizza — perfectly united.",
    price: 550,
    category: "chicken",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80",
    ingredients: ["Buffalo chicken", "Blue cheese", "Celery", "Hot sauce", "Spring onions"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: true,
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 68,
    location: "Rajshahi",
  },
  {
    name: "Mediterranean Tuna",
    description: "Flaked premium tuna, capers, kalamata olives, red onion and cherry tomatoes on a light tomato base. Fresh, Mediterranean flavours in every slice.",
    price: 490,
    category: "seafood",
    image: "https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=600&q=80",
    ingredients: ["Tuna", "Capers", "Kalamata olives", "Red onion", "Cherry tomatoes"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    isAvailable: true,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 44,
    location: "Khulna",
  },
  {
    name: "Vegan Avocado Pesto",
    description: "Dairy-free mozzarella, house-made vegan pesto, fresh avocado slices, cherry tomatoes and toasted pine nuts. 100% plant-based and absolutely delicious.",
    price: 520,
    category: "vegan",
    image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80",
    ingredients: ["Vegan mozzarella", "Vegan pesto", "Avocado", "Cherry tomatoes", "Pine nuts"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 51,
    location: "Sylhet",
  },
  {
    name: "Ultimate Meat Feast",
    description: "The meat lover's dream. Pepperoni, Italian sausage, smoked beef, and ham piled high on a rich tomato base with melted mozzarella. No compromises.",
    price: 720,
    category: "meat",
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80",
    ingredients: ["Pepperoni", "Italian sausage", "Smoked beef", "Ham", "Mozzarella"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 182,
    location: "Dhaka",
  },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("pizzahub");

    // Insert vendors (upsert by email)
    for (const vendor of sampleVendors) {
      await db.collection("user").updateOne(
        { email: vendor.email },
        { $setOnInsert: vendor },
        { upsert: true }
      );
    }
    console.log("✅ Vendors seeded");

    // Get vendor IDs from DB
    const mario = await db.collection("user").findOne({ email: "mario@pizzahub.com" });
    const bella = await db.collection("user").findOne({ email: "bella@pizzahub.com" });

    const marioId = mario._id.toString();
    const bellaId = bella._id.toString();

    // Clear existing menu items
    await db.collection("menuitems").deleteMany({});

    // Split menu items between vendors
    const marioItems = menuItems.slice(0, 6).map((item) => ({
      ...item,
      vendorId: marioId,
      vendorName: "Mario's Pizzeria",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "approved",
    }));

    const bellaItems = menuItems.slice(6).map((item) => ({
      ...item,
      vendorId: bellaId,
      vendorName: "Bella Roma Kitchen",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "approved",
    }));

    await db.collection("menuitems").insertMany([...marioItems, ...bellaItems]);
    console.log(`✅ ${marioItems.length + bellaItems.length} menu items seeded`);

    // Verify
    const count = await db.collection("menuitems").countDocuments();
    console.log(`✅ Total menu items in DB: ${count}`);

    const featured = await db.collection("menuitems").countDocuments({ isFeatured: true });
    console.log(`✅ Featured items: ${featured}`);
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
