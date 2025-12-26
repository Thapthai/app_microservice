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
  
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      
      return true;
    } else {
     
      return false;
    }
  } catch (error) {
    
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
 
    return response.data;
  } catch (error) {
 
    throw error;
  }
}

async function createItemsBatch() {
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
 
    process.exit(1);
  }
 
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= TOTAL_ITEMS; i++) {
    try {
      await createItem(i);
      successCount++;

 
    } catch (error) {
      failCount++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

 
}

// Run the script
createItemsBatch()
  .then(() => {
 
    process.exit(0);
  })
  .catch((error) => {
 
    process.exit(1);
  });

