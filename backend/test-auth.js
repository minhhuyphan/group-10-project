const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    age: 25
};

const adminUser = {
    email: 'admin@example.com',
    password: 'admin123'
};

let userToken = '';
let adminToken = '';
let testUserId = '';

async function testAuthentication() {
    try {
        console.log('🧪 Testing Authentication System...\n');
        
        // Test 1: Database connection
        console.log('1. Testing database connection');
        try {
            const dbResponse = await axios.get(`${BASE_URL}/test/db`);
            console.log('✅ Database:', dbResponse.data.message);
            console.log('   Stats:', dbResponse.data.stats);
        } catch (error) {
            console.log('❌ Database connection failed');
        }
        console.log();
        
        // Test 2: User Registration
        console.log('2. Testing user registration');
        try {
            const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
            console.log('✅ Signup successful:', signupResponse.data.message);
            console.log('   User:', signupResponse.data.user.name, '-', signupResponse.data.user.email);
            userToken = signupResponse.data.token;
            testUserId = signupResponse.data.user.id;
        } catch (error) {
            console.log('❌ Signup failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 3: Admin Login
        console.log('3. Testing admin login');
        try {
            const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, adminUser);
            console.log('✅ Admin login successful:', adminLoginResponse.data.message);
            console.log('   Admin:', adminLoginResponse.data.user.name, '-', adminLoginResponse.data.user.role);
            adminToken = adminLoginResponse.data.token;
        } catch (error) {
            console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 4: User Login
        console.log('4. Testing user login');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            console.log('✅ User login successful:', loginResponse.data.message);
            console.log('   User:', loginResponse.data.user.name, '-', loginResponse.data.user.role);
            userToken = loginResponse.data.token; // Update token
        } catch (error) {
            console.log('❌ User login failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 5: Get Profile
        console.log('5. Testing get profile');
        try {
            const profileResponse = await axios.get(`${BASE_URL}/profile`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Get profile successful:', profileResponse.data.message);
            console.log('   Profile:', profileResponse.data.user.name, '-', profileResponse.data.user.email);
        } catch (error) {
            console.log('❌ Get profile failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 6: Update Profile
        console.log('6. Testing update profile');
        try {
            const updateResponse = await axios.put(`${BASE_URL}/profile`, {
                name: 'Updated Test User',
                age: 26
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Update profile successful:', updateResponse.data.message);
            console.log('   Updated:', updateResponse.data.user.name, '- Age:', updateResponse.data.user.age);
        } catch (error) {
            console.log('❌ Update profile failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 7: Admin - Get Users List
        console.log('7. Testing admin get users list');
        try {
            const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ Get users list successful:', usersResponse.data.message);
            console.log('   Total users:', usersResponse.data.users.length);
            console.log('   Users:', usersResponse.data.users.map(u => `${u.name} (${u.role})`).join(', '));
        } catch (error) {
            console.log('❌ Get users list failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 8: Change Password
        console.log('8. Testing change password');
        try {
            const changePasswordResponse = await axios.put(`${BASE_URL}/profile/password`, {
                currentPassword: testUser.password,
                newPassword: 'newpassword123'
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Change password successful:', changePasswordResponse.data.message);
        } catch (error) {
            console.log('❌ Change password failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 9: Forgot Password
        console.log('9. Testing forgot password');
        try {
            const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
                email: testUser.email
            });
            console.log('✅ Forgot password successful:', forgotResponse.data.message);
            if (forgotResponse.data.resetToken) {
                console.log('   Reset token:', forgotResponse.data.resetToken);
                
                // Test 10: Reset Password
                console.log('10. Testing reset password');
                try {
                    const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
                        token: forgotResponse.data.resetToken,
                        newPassword: 'resetpassword123'
                    });
                    console.log('✅ Reset password successful:', resetResponse.data.message);
                } catch (error) {
                    console.log('❌ Reset password failed:', error.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.log('❌ Forgot password failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        // Test 11: Logout
        console.log('11. Testing logout');
        try {
            const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Logout successful:', logoutResponse.data.message);
        } catch (error) {
            console.log('❌ Logout failed:', error.response?.data?.message || error.message);
        }
        console.log();
        
        console.log('🎉 Authentication tests completed!');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run tests if server is running
console.log('🔄 Starting authentication tests...');
console.log('Make sure the authentication server is running on port 3001\n');

setTimeout(() => {
    testAuthentication();
}, 1000);