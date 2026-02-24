const axios = require('axios');

async function testAuth() {
  const email = `test${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test User';
  const baseUrl = 'http://localhost:3000/api';

  try {
    console.log('1. Registering user...');
    const registerRes = await axios.post(`${baseUrl}/auth/register`, {
      email,
      password,
      name
    });
    
    console.log('Register response:', registerRes.data);
    
    if (!registerRes.data.user) {
      console.error('FAILED: Register response does not contain user info');
    } else {
      console.log('SUCCESS: Register response contains user info');
    }

    const token = registerRes.data.access_token;

    console.log('\n2. Logging in...');
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email,
      password
    });

    console.log('Login response:', loginRes.data);
    
    if (!loginRes.data.user) {
      console.error('FAILED: Login response does not contain user info');
    } else {
      console.log('SUCCESS: Login response contains user info');
    }

    console.log('\n3. Testing /auth/me...');
    const meRes = await axios.get(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('/auth/me response:', meRes.data);
    
    if (meRes.data.email === email) {
      console.log('SUCCESS: /auth/me returned correct profile');
    } else {
      console.error('FAILED: /auth/me returned incorrect profile');
    }

  } catch (error) {
    console.error('Error Details:', error);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testAuth();
