const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testCRUD() {
  try {
    console.log('🧪 Testing CRUD APIs...\n');
    
    // Test GET - Lấy danh sách users
    console.log('1. Testing GET /users');
    const getResponse = await axios.get(`${BASE_URL}/users`);
    console.log('✅ GET Users:', getResponse.data.length, 'users found');
    console.log(getResponse.data);
    console.log();
    
    // Test POST - Thêm user mới
    console.log('2. Testing POST /users');
    const newUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      age: 25
    };
    const postResponse = await axios.post(`${BASE_URL}/users`, newUser);
    console.log('✅ POST User created:', postResponse.data);
    const createdUserId = postResponse.data._id;
    console.log();
    
    // Test PUT - Cập nhật user
    console.log('3. Testing PUT /users/:id');
    const updatedUser = {
      name: 'Updated Test User',
      email: 'updated.testuser@example.com',
      age: 30
    };
    const putResponse = await axios.put(`${BASE_URL}/users/${createdUserId}`, updatedUser);
    console.log('✅ PUT User updated:', putResponse.data);
    console.log();
    
    // Test DELETE - Xóa user
    console.log('4. Testing DELETE /users/:id');
    const deleteResponse = await axios.delete(`${BASE_URL}/users/${createdUserId}`);
    console.log('✅ DELETE User deleted:', deleteResponse.data);
    console.log();
    
    // Test GET lại để xác nhận đã xóa
    console.log('5. Testing GET /users after delete');
    const getFinalResponse = await axios.get(`${BASE_URL}/users`);
    console.log('✅ Final GET Users:', getFinalResponse.data.length, 'users found');
    console.log();
    
    console.log('🎉 All CRUD tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCRUD();