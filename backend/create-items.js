const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TOTAL_ITEMS = 1000;

// ========== Configuration - แก้ไขตรงนี้ ==========
const LOGIN_EMAIL = 'admin@email.com';
const LOGIN_PASSWORD = 'password';
// ==================================================

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful!');
      console.log('');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createItem(n) {
  const item = {
    name: `item ${n}`,
    description: `description of item ${n}`,
    price: Math.floor(Math.random() * 10000) + 100, // Random price between 100-10,099
    quantity: Math.floor(Math.random() * 100) + 1, // Random quantity between 1-100
    category_id: 1
  };

  try {
    const response = await axios.post(`${BASE_URL}/items`, item, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log(`✅ Created item ${n}:`, response.data.message || 'Success');
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create item ${n}:`, error.response?.data?.message || error.message);
    throw error;
  }
}

async function createItemsBatch() {
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('💥 Cannot proceed without authentication');
    process.exit(1);
  }

  console.log(`🚀 Starting to create ${TOTAL_ITEMS} items...`);
  console.log('');

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= TOTAL_ITEMS; i++) {
    try {
      await createItem(i);
      successCount++;

      // Show progress every 50 items
      if (i % 50 === 0) {
        console.log(`📊 Progress: ${i}/${TOTAL_ITEMS} items created`);
      }
    } catch (error) {
      failCount++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✨ Summary:');
  console.log(`   Total items: ${TOTAL_ITEMS}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏱️  Time taken: ${duration} seconds`);
  console.log('═══════════════════════════════════════');
}

// Run the script
createItemsBatch()
  .then(() => {
    console.log('🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

