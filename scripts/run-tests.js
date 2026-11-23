require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000';
const CLIENT_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🔍 STARTING PIZZAHUB AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pizzahub');
  const userCol = db.collection('user');
  const menuCol = db.collection('menuitems');
  const orderCol = db.collection('orders');
  const txCol = db.collection('transactions');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // ── TEST 1: Server Health Check ──
  console.log('--- TEST 1: Server Health Check ---');
  try {
    const res = await fetch(`${API_BASE}/`);
    const data = await res.json();
    assert(res.ok && data.message.includes('PizzaHub API'), 'Server root returns health message');
  } catch (e) {
    assert(false, 'Server root returns health message', e.message);
  }

  // ── TEST 2: Public Menu Items API ──
  console.log('\n--- TEST 2: Public Menu Items API ---');
  try {
    const res = await fetch(`${API_BASE}/api/menu-items`);
    const data = await res.json();
    assert(res.ok && Array.isArray(data.items), 'GET /api/menu-items returns items array');
    assert(data.items.length > 0, `Returns approved items (count: ${data.items.length})`);
    
    // Check that ALL returned items are approved
    const allApproved = data.items.every(i => i.status === 'approved');
    assert(allApproved, 'Only approved items are returned publicly');
  } catch (e) {
    assert(false, 'Public Menu Items API', e.message);
  }

  // ── TEST 3: Category Filtering ──
  console.log('\n--- TEST 3: Category Filtering ---');
  const categories = [
    'Classic Pizzas',
    'Vegetarian Pizzas',
    'Meat Lovers',
    'Specialty / Gourmet Pizzas',
    'Sides & Appetizers',
    'Beverages & Desserts',
  ];
  for (const cat of categories) {
    try {
      const res = await fetch(`${API_BASE}/api/menu-items?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      assert(res.ok && data.items.length > 0, `Category filter "${cat}" returns items (${data.items.length} found)`);
    } catch (e) {
      assert(false, `Category filter "${cat}"`, e.message);
    }
  }

  // ── TEST 4: Search & Location Filter ──
  console.log('\n--- TEST 4: Search & Location Filter ---');
  try {
    const resSearch = await fetch(`${API_BASE}/api/menu-items?search=Deshi`);
    const dataSearch = await resSearch.json();
    assert(resSearch.ok && dataSearch.items.length > 0, `Search for "Deshi" returns results (${dataSearch.items.length} items)`);

    const resLoc = await fetch(`${API_BASE}/api/menu-items?location=Dhaka`);
    const dataLoc = await resLoc.json();
    assert(resLoc.ok && dataLoc.items.length > 0, `Location filter "Dhaka" returns results (${dataLoc.items.length} items)`);
  } catch (e) {
    assert(false, 'Search & Location Filter', e.message);
  }

  // ── TEST 5: Single Item Detail ──
  console.log('\n--- TEST 5: Single Item Detail ---');
  try {
    const sampleItem = await menuCol.findOne({ status: 'approved' });
    const res = await fetch(`${API_BASE}/api/menu-items/${sampleItem._id}`);
    const data = await res.json();
    assert(res.ok && (data.itemName === sampleItem.itemName || data.name === sampleItem.name), `Single item fetch works for ID: ${sampleItem._id}`);

    // Test invalid ID returns 400 or 404
    const resInvalid = await fetch(`${API_BASE}/api/menu-items/nonexistentid123`);
    assert(resInvalid.status === 400 || resInvalid.status === 404, 'Invalid ID returns 400/404 error');
  } catch (e) {
    assert(false, 'Single Item Detail', e.message);
  }

  // ── TEST 6: Security & Role Middleware Verification ──
  console.log('\n--- TEST 6: Security & Role Middleware ---');
  try {
    // Unauthenticated request to protected route
    const resNoAuth = await fetch(`${API_BASE}/api/orders/my-orders`);
    assert(resNoAuth.status === 401, 'Unauthenticated access to /api/orders/my-orders returns 401');

    const resAdminNoAuth = await fetch(`${API_BASE}/api/users`);
    assert(resAdminNoAuth.status === 401, 'Unauthenticated access to /api/users returns 401');

    // Create JWT for a customer
    const customerUser = await userCol.findOne({ role: 'customer', isBlocked: { $ne: true } });
    if (customerUser) {
      const customerToken = jwt.sign(
        { id: customerUser._id.toString(), email: customerUser.email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Customer trying to access Admin route
      const resAdminWithCust = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(resAdminWithCust.status === 403, 'Customer token cannot access admin routes (returns 403)');

      // Customer trying to access Vendor route
      const resVendorWithCust = await fetch(`${API_BASE}/api/orders/vendor-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(resVendorWithCust.status === 403, 'Customer token cannot access vendor routes (returns 403)');

      // Customer accessing customer route
      const resCustOrders = await fetch(`${API_BASE}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(resCustOrders.ok, 'Customer token CAN access customer routes (200 OK)');
    } else {
      console.log('  ⚠️ Skipping customer token test (no unblocked customer found in DB)');
    }

    // Create JWT for an admin
    const adminUser = await userCol.findOne({ role: 'admin' });
    if (adminUser) {
      const adminToken = jwt.sign(
        { id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const resAdminStats = await fetch(`${API_BASE}/api/users/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAdminStats.ok, 'Admin token CAN access admin stats (200 OK)');
    }
  } catch (e) {
    assert(false, 'Security & Role Middleware', e.message);
  }

  // ── TEST 7: Vendor 3-Item Limit on Free Plan ──
  console.log('\n--- TEST 7: Vendor 3-Item Limit on Free Plan ---');
  try {
    const freeVendor = await userCol.findOne({ role: 'vendor', subscriptionPlan: { $ne: 'premium' } });
    if (freeVendor) {
      const vendorToken = jwt.sign(
        { id: freeVendor._id.toString(), email: freeVendor.email, role: 'vendor' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      // Count vendor items
      const count = await menuCol.countDocuments({
        vendorId: freeVendor._id.toString(),
        status: { $in: ['approved', 'pending'] }
      });

      if (count >= 3) {
        // Try creating a 4th item
        const resCreate = await fetch(`${API_BASE}/api/menu-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${vendorToken}`
          },
          body: JSON.stringify({
            itemName: 'Test 4th Pizza',
            category: 'Classic Pizzas',
            description: 'Testing limit',
            price: 500,
            location: 'Dhaka',
            images: ['https://example.com/test.jpg']
          })
        });
        const errData = await resCreate.json();
        assert(resCreate.status === 403 && errData.code === 'PLAN_LIMIT', 'Vendor on free plan is blocked from adding >3 items with code PLAN_LIMIT');
      } else {
        console.log(`  ℹ️ Free vendor currently has ${count} items (< 3), limit check will trigger once 3 is reached.`);
      }
    }
  } catch (e) {
    assert(false, 'Vendor 3-Item Limit', e.message);
  }

  // ── TEST 8: Blocked User Enforcement ──
  console.log('\n--- TEST 8: Blocked User Enforcement ---');
  try {
    // Find or temporarily block a test user
    const testUser = await userCol.findOne({ role: 'customer' });
    if (testUser) {
      // Create token for this user
      const userToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set isBlocked: true
      await userCol.updateOne({ _id: testUser._id }, { $set: { isBlocked: true } });

      // Request should return 403
      const resBlocked = await fetch(`${API_BASE}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(resBlocked.status === 403, 'Blocked user receives 403 Forbidden even with valid token');

      // Unblock user back
      await userCol.updateOne({ _id: testUser._id }, { $set: { isBlocked: false } });

      // Request should now succeed
      const resUnblocked = await fetch(`${API_BASE}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(resUnblocked.status === 200, 'Unblocked user can make requests again (200 OK)');
    }
  } catch (e) {
    assert(false, 'Blocked User Enforcement', e.message);
  }

  // ── TEST 9: Order Flow & Validation Rules ──
  console.log('\n--- TEST 9: Order Flow & Validation Rules ---');
  try {
    const customer = await userCol.findOne({ role: 'customer', isBlocked: { $ne: true } });
    const approvedItem = await menuCol.findOne({ status: 'approved' });

    if (customer && approvedItem) {
      const customerToken = jwt.sign(
        { id: customer._id.toString(), email: customer.email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Vendors cannot order their own items check
      const vendorToken = jwt.sign(
        { id: approvedItem.vendorId, email: 'vendor@test.com', role: 'customer' }, // even if forged as customer
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const resOwnOrder = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`
        },
        body: JSON.stringify({
          itemId: approvedItem._id.toString(),
          deliveryDate: new Date(Date.now() + 86400000).toISOString(),
          deliveryAddress: 'Test Address',
        })
      });
      assert(resOwnOrder.status === 400, 'Ordering own item is rejected with 400 Bad Request');

      // Missing fields check
      const resMissing = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          itemId: approvedItem._id.toString(),
          // missing deliveryDate & deliveryAddress
        })
      });
      assert(resMissing.status === 400, 'Order without required fields is rejected with 400 Bad Request');
    }
  } catch (e) {
    assert(false, 'Order Flow Validation', e.message);
  }

  // ── TEST 10: Transactions Read-Only for Admin ──
  console.log('\n--- TEST 10: Transactions Read-Only for Admin ---');
  try {
    const adminUser = await userCol.findOne({ role: 'admin' });
    if (adminUser) {
      const adminToken = jwt.sign(
        { id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const resTx = await fetch(`${API_BASE}/api/payments/transactions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataTx = await resTx.json();
      assert(resTx.ok && Array.isArray(dataTx), 'Admin can view transactions list');
    }
  } catch (e) {
    assert(false, 'Transactions Read-Only', e.message);
  }

  // ── TEST 11: Customer Rating & Review Submission ──
  console.log('\n--- TEST 11: Customer Rating & Review Submission ---');
  try {
    const customer = await userCol.findOne({ role: 'customer', isBlocked: { $ne: true } });
    const item = await menuCol.findOne({ status: 'approved' });

    if (customer && item) {
      const customerToken = jwt.sign(
        { id: customer._id.toString(), email: customer.email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Submit review
      const resRev = await fetch(`${API_BASE}/api/menu-items/${item._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          rating: 5,
          review: 'E2E test: Delicious pizza, crust was crisp!'
        })
      });
      const dataRev = await resRev.json();
      assert(resRev.ok, 'Customer can submit a 5-star review');
      assert(dataRev.item?.rating >= 1, 'Item rating is calculated and updated');
      assert(dataRev.item?.ratings?.length > 0, 'Item ratings array contains review');

      // Invalid rating rejection
      const resBadRating = await fetch(`${API_BASE}/api/menu-items/${item._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          rating: 7, // invalid: must be 1-5
          review: 'Bad rating test'
        })
      });
      assert(resBadRating.status === 400, 'Invalid rating (out of 1-5 range) rejected with 400');
    }
  } catch (e) {
    assert(false, 'Customer Review Submission', e.message);
  }

  // ── SUMMARY ──
  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await client.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
