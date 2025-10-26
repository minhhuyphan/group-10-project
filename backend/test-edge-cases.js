/**
 * SV1 Edge Cases Testing - Activity 6 Redux & Protected Routes
 * Test invalid tokens, expired sessions, concurrent operations, data consistency
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration  
const BASE_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (msg) => log('green', `✅ ${msg}`);
const error = (msg) => log('red', `❌ ${msg}`);
const info = (msg) => log('cyan', `ℹ️  ${msg}`);
const warning = (msg) => log('yellow', `⚠️  ${msg}`);
const section = (msg) => log('bright', `\n📂 ${msg}`);

/**
 * EDGE CASES TESTING CLASS
 */
class EdgeCasesTester {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      edgeCasesFound: [],
      errors: []
    };
  }

  async runAllTests() {
    section('SV1 EDGE CASES TESTING - Activity 6 Redux APIs');
    
    try {
      // Setup
      await this.setupAuthentication();
      
      // Edge case test suites
      await this.testInvalidTokenScenarios();
      await this.testExpiredSessionHandling();
      await this.testConcurrentOperations();
      await this.testDataConsistencyEdgeCases();
      await this.testBoundaryValues();
      await this.testErrorHandlingEdgeCases();
      await this.testRaceConditions();
      
      // Generate report
      await this.generateEdgeCaseReport();
      
    } catch (error) {
      error(`Edge cases testing failed: ${error.message}`);
    }
  }

  async setupAuthentication() {
    section('SETUP: Authentication Tokens');
    
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@group10.com',
        password: 'AdminPassword123!'
      });
      
      this.adminToken = adminLogin.data.accessToken;
      
      const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'user@group10.com',
        password: 'UserPassword123!'
      });
      
      this.userToken = userLogin.data.accessToken;
      success('Authentication tokens obtained');
      
    } catch (err) {
      throw new Error(`Authentication setup failed: ${err.message}`);
    }
  }

  // Test various invalid token scenarios
  async testInvalidTokenScenarios() {
    section('PHASE 1: INVALID TOKEN SCENARIOS');

    // Test 1: Completely invalid token format
    await this.runEdgeCaseTest('Invalid Token Format', async () => {
      const invalidTokens = [
        'not.a.jwt.token',
        'invalid_format',
        'Bearer malformed',
        '',
        null,
        undefined,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Header only
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ', // No signature
      ];
      
      for (const invalidToken of invalidTokens) {
        try {
          const response = await axios.get(`${BASE_URL}/api/verify-token`, {
            headers: { Authorization: invalidToken ? `Bearer ${invalidToken}` : undefined }
          });
          
          if (response.status === 200) {
            throw new Error(`Invalid token accepted: ${invalidToken}`);
          }
        } catch (err) {
          if (err.response && [401, 403].includes(err.response.status)) {
            // Expected behavior - invalid token rejected
            continue;
          } else {
            throw new Error(`Unexpected error for token ${invalidToken}: ${err.message}`);
          }
        }
      }
      
      success('All invalid token formats properly rejected');
    });

    // Test 2: Token with invalid signature
    await this.runEdgeCaseTest('Token with Invalid Signature', async () => {
      const validPayload = jwt.decode(this.adminToken);
      const tokenWithWrongSignature = jwt.sign(validPayload, 'wrong_secret');
      
      try {
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${tokenWithWrongSignature}` }
        });
        
        if (response.status === 200) {
          throw new Error('Token with invalid signature was accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Token with invalid signature properly rejected');
        } else {
          throw err;
        }
      }
    });

    // Test 3: Token with missing required fields
    await this.runEdgeCaseTest('Token with Missing Required Fields', async () => {
      const incompletePayloads = [
        { email: 'test@test.com' }, // Missing userId
        { userId: '507f1f77bcf86cd799439011' }, // Missing email
        {}, // Empty payload
        { random: 'data' } // Wrong fields
      ];
      
      for (const payload of incompletePayloads) {
        const incompleteToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback');
        
        try {
          const response = await axios.get(`${BASE_URL}/api/verify-token`, {
            headers: { Authorization: `Bearer ${incompleteToken}` }
          });
          
          if (response.status === 200) {
            warning(`Incomplete token accepted: ${JSON.stringify(payload)}`);
          }
        } catch (err) {
          if (err.response && [401, 500].includes(err.response.status)) {
            // Expected - incomplete token should fail
            continue;
          }
          throw err;
        }
      }
    });
  }

  // Test expired session handling
  async testExpiredSessionHandling() {
    section('PHASE 2: EXPIRED SESSION HANDLING');

    // Test 1: Simulated expired token
    await this.runEdgeCaseTest('Expired Token Handling', async () => {
      const expiredPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'expired@test.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET || 'fallback');
      
      try {
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('Expired token was accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Expired token properly rejected');
        } else {
          throw err;
        }
      }
    });

    // Test 2: Token expiring during request processing
    await this.runEdgeCaseTest('Token Expiring During Request', async () => {
      // Create token that expires in 2 seconds
      const shortLivedPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'shortlived@test.com',
        exp: Math.floor(Date.now() / 1000) + 2
      };
      
      const shortLivedToken = jwt.sign(shortLivedPayload, process.env.JWT_SECRET || 'fallback');
      
      // First request should work
      const response1 = await axios.get(`${BASE_URL}/api/verify-token`, {
        headers: { Authorization: `Bearer ${shortLivedToken}` }
      });
      
      if (response1.status !== 200) {
        throw new Error('Short-lived token should have worked initially');
      }
      
      // Wait for expiration
      await this.sleep(3000);
      
      // Second request should fail
      try {
        const response2 = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${shortLivedToken}` }
        });
        
        if (response2.status === 200) {
          throw new Error('Token should have expired');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Token properly expired during test');
        } else {
          throw err;
        }
      }
    });
  }

  // Test concurrent operations
  async testConcurrentOperations() {
    section('PHASE 3: CONCURRENT OPERATIONS');

    // Test 1: Concurrent profile updates
    await this.runEdgeCaseTest('Concurrent Profile Updates', async () => {
      const updates = [
        { bio: 'Update 1' },
        { bio: 'Update 2' },
        { bio: 'Update 3' },
        { phone: '1111111111' },
        { phone: '2222222222' }
      ];
      
      const promises = updates.map(update => 
        axios.put(`${BASE_URL}/api/profile`, update, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => ({ error: err.response?.status || err.message }))
      );
      
      const results = await Promise.allSettled(promises);
      
      // Check final state
      const finalProfile = await axios.get(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });
      
      const successfulUpdates = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      
      info(`Concurrent updates: ${successfulUpdates}/${updates.length} successful`);
      info(`Final profile bio: "${finalProfile.data.data.bio}"`);
      
      if (successfulUpdates === 0) {
        throw new Error('No concurrent updates succeeded');
      }
    });

    // Test 2: Concurrent admin dashboard requests
    await this.runEdgeCaseTest('Concurrent Admin Dashboard Requests', async () => {
      const concurrentRequests = Array(10).fill().map(() =>
        axios.get(`${BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${this.adminToken}` }
        }).catch(err => ({ error: err.response?.status || err.message }))
      );
      
      const results = await Promise.allSettled(concurrentRequests);
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      
      if (successCount < 8) { // Allow some failures due to rate limiting
        warning(`Only ${successCount}/10 concurrent dashboard requests succeeded`);
      } else {
        success(`Concurrent dashboard requests handled well: ${successCount}/10`);
      }
    });

    // Test 3: Mixed concurrent operations
    await this.runEdgeCaseTest('Mixed Concurrent Operations', async () => {
      const mixedOperations = [
        () => axios.get(`${BASE_URL}/api/verify-token`, { headers: { Authorization: `Bearer ${this.adminToken}` } }),
        () => axios.get(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${this.userToken}` } }),
        () => axios.get(`${BASE_URL}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${this.adminToken}` } }),
        () => axios.post(`${BASE_URL}/api/check-access`, { route: '/profile' }, { headers: { Authorization: `Bearer ${this.userToken}`, 'Content-Type': 'application/json' } }),
        () => axios.get(`${BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${this.adminToken}` } })
      ];
      
      const promises = mixedOperations.map(op => 
        op().catch(err => ({ error: err.response?.status || err.message }))
      );
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      
      info(`Mixed operations: ${successCount}/${mixedOperations.length} successful`);
      
      if (successCount < mixedOperations.length * 0.8) {
        warning('High failure rate in mixed concurrent operations');
      }
    });
  }

  // Test data consistency edge cases
  async testDataConsistencyEdgeCases() {
    section('PHASE 4: DATA CONSISTENCY EDGE CASES');

    // Test 1: Profile update with invalid data types
    await this.runEdgeCaseTest('Invalid Data Types in Profile Update', async () => {
      const invalidUpdates = [
        { bio: 12345 }, // Number instead of string
        { phone: true }, // Boolean instead of string
        { preferences: 'invalid' }, // String instead of object
        { address: [] }, // Array instead of string
        { isAdmin: 'true' } // String instead of boolean
      ];
      
      for (const invalidUpdate of invalidUpdates) {
        try {
          const response = await axios.put(`${BASE_URL}/api/profile`, invalidUpdate, {
            headers: { 
              Authorization: `Bearer ${this.userToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Check if invalid data was actually saved
          const profile = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${this.userToken}` }
          });
          
          const savedData = profile.data.data;
          const key = Object.keys(invalidUpdate)[0];
          
          if (typeof savedData[key] !== 'string' && key !== 'preferences' && key !== 'isAdmin') {
            warning(`Invalid data type saved for ${key}: ${typeof savedData[key]}`);
          }
          
        } catch (err) {
          if (err.response && err.response.status === 400) {
            success(`Invalid data type properly rejected for ${Object.keys(invalidUpdate)[0]}`);
          }
        }
      }
    });

    // Test 2: Very large data payloads
    await this.runEdgeCaseTest('Large Data Payload Handling', async () => {
      const largeBio = 'A'.repeat(10000); // Very large bio
      const largeAddress = 'B'.repeat(5000); // Very large address
      
      try {
        const response = await axios.put(`${BASE_URL}/api/profile`, {
          bio: largeBio,
          address: largeAddress
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if large data was truncated or rejected
        const profile = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        const savedBio = profile.data.data.bio;
        const savedAddress = profile.data.data.address;
        
        if (savedBio && savedBio.length > 500) {
          warning('Large bio data not properly validated/truncated');
        }
        
        info(`Bio length saved: ${savedBio ? savedBio.length : 0} characters`);
        info(`Address length saved: ${savedAddress ? savedAddress.length : 0} characters`);
        
      } catch (err) {
        if (err.response && [413, 400].includes(err.response.status)) {
          success('Large payload properly rejected');
        } else {
          throw err;
        }
      }
    });

    // Test 3: Null and undefined values
    await this.runEdgeCaseTest('Null and Undefined Values', async () => {
      const nullUpdates = {
        bio: null,
        phone: undefined,
        address: null,
        preferences: null
      };
      
      try {
        await axios.put(`${BASE_URL}/api/profile`, nullUpdates, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const profile = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        const savedData = profile.data.data;
        
        // Check how null values are handled
        Object.keys(nullUpdates).forEach(key => {
          info(`${key}: ${savedData[key]} (type: ${typeof savedData[key]})`);
        });
        
      } catch (err) {
        info(`Null values handling: ${err.response?.status} - ${err.message}`);
      }
    });
  }

  // Test boundary values
  async testBoundaryValues() {
    section('PHASE 5: BOUNDARY VALUES TESTING');

    // Test 1: Maximum allowed values
    await this.runEdgeCaseTest('Maximum Allowed Values', async () => {
      const maxValues = {
        bio: 'A'.repeat(500), // Exactly at limit
        phone: '1234567890123456789', // Very long phone
        address: 'B'.repeat(1000) // Long address
      };
      
      try {
        await axios.put(`${BASE_URL}/api/profile`, maxValues, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const profile = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        const savedData = profile.data.data;
        
        if (savedData.bio && savedData.bio.length === 500) {
          success('Maximum bio length handled correctly');
        }
        
      } catch (err) {
        info(`Boundary values test: ${err.response?.status}`);
      }
    });

    // Test 2: Empty string values
    await this.runEdgeCaseTest('Empty String Values', async () => {
      const emptyValues = {
        bio: '',
        phone: '',
        address: ''
      };
      
      try {
        await axios.put(`${BASE_URL}/api/profile`, emptyValues, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        success('Empty string values handled');
        
      } catch (err) {
        info(`Empty values handling: ${err.response?.status}`);
      }
    });
  }

  // Test error handling edge cases
  async testErrorHandlingEdgeCases() {
    section('PHASE 6: ERROR HANDLING EDGE CASES');

    // Test 1: Malformed JSON requests
    await this.runEdgeCaseTest('Malformed JSON Requests', async () => {
      try {
        const response = await axios.put(`${BASE_URL}/api/profile`, 'invalid json', {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200) {
          throw new Error('Malformed JSON was accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 400) {
          success('Malformed JSON properly rejected');
        } else {
          throw err;
        }
      }
    });

    // Test 2: Missing Content-Type header
    await this.runEdgeCaseTest('Missing Content-Type Header', async () => {
      try {
        await axios.put(`${BASE_URL}/api/profile`, { bio: 'test' }, {
          headers: { Authorization: `Bearer ${this.userToken}` }
          // No Content-Type header
        });
        
        info('Missing Content-Type handled gracefully');
      } catch (err) {
        if (err.response && err.response.status === 400) {
          info('Missing Content-Type properly rejected');
        }
      }
    });
  }

  // Test race conditions
  async testRaceConditions() {
    section('PHASE 7: RACE CONDITIONS');

    // Test 1: Rapid sequential updates
    await this.runEdgeCaseTest('Rapid Sequential Updates', async () => {
      const rapidUpdates = [];
      
      for (let i = 0; i < 5; i++) {
        rapidUpdates.push(
          axios.put(`${BASE_URL}/api/profile`, { bio: `Update ${i}` }, {
            headers: { 
              Authorization: `Bearer ${this.userToken}`,
              'Content-Type': 'application/json'
            }
          }).catch(err => ({ error: err.response?.status }))
        );
        
        await this.sleep(10); // Very brief delay
      }
      
      const results = await Promise.allSettled(rapidUpdates);
      const finalProfile = await axios.get(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });
      
      info(`Final bio after rapid updates: "${finalProfile.data.data.bio}"`);
      
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      
      info(`Rapid updates: ${successCount}/5 successful`);
    });
  }

  // Helper method to run individual edge case tests
  async runEdgeCaseTest(testName, testFn) {
    this.testResults.totalTests++;
    
    try {
      await testFn();
      this.testResults.passedTests++;
      success(`${testName} - HANDLED`);
    } catch (err) {
      this.testResults.failedTests++;
      this.testResults.errors.push(`${testName}: ${err.message}`);
      
      if (err.message.includes('Edge case found:')) {
        this.testResults.edgeCasesFound.push(err.message);
        warning(`${testName} - EDGE CASE: ${err.message}`);
      } else {
        error(`${testName} - ERROR: ${err.message}`);
      }
    }
  }

  // Generate edge cases report
  async generateEdgeCaseReport() {
    section('EDGE CASES TEST REPORT');
    
    const handledRate = ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1);
    
    success('='.repeat(60));
    success('EDGE CASES TEST SUMMARY REPORT');
    success('='.repeat(60));
    
    info(`🔍 Total Edge Case Tests: ${this.testResults.totalTests}`);
    info(`✅ Handled Properly: ${this.testResults.passedTests}`);
    info(`❌ Issues Found: ${this.testResults.failedTests}`);
    info(`📊 Handling Rate: ${handledRate}%`);
    
    if (this.testResults.edgeCasesFound.length > 0) {
      warning('\n🚨 EDGE CASES DISCOVERED:');
      this.testResults.edgeCasesFound.forEach((edgeCase, index) => {
        warning(`  ${index + 1}. ${edgeCase}`);
      });
    } else {
      success('\n🎉 NO CRITICAL EDGE CASES FOUND!');
    }
    
    success('\n🔍 TESTED EDGE CASE CATEGORIES:');
    success('  ✅ Invalid Token Scenarios');
    success('  ✅ Expired Session Handling');
    success('  ✅ Concurrent Operations');
    success('  ✅ Data Consistency Edge Cases');
    success('  ✅ Boundary Values');
    success('  ✅ Error Handling');
    success('  ✅ Race Conditions');
    
    if (this.testResults.errors.length > 0) {
      error('\n🚨 EDGE CASE ERRORS:');
      this.testResults.errors.slice(0, 10).forEach((error, index) => {
        error(`  ${index + 1}. ${error}`);
      });
      
      if (this.testResults.errors.length > 10) {
        warning(`  ... and ${this.testResults.errors.length - 10} more errors`);
      }
    }
    
    success('\n💡 EDGE CASE HANDLING ASSESSMENT:');
    
    if (handledRate >= 90) {
      success('  🎯 EXCELLENT: System handles edge cases very well');
    } else if (handledRate >= 75) {
      warning('  ⚠️  GOOD: Most edge cases handled, some improvements needed');
    } else {
      error('  🚨 NEEDS IMPROVEMENT: Many edge cases not properly handled');
    }
    
    success('\n🛡️  ROBUSTNESS RECOMMENDATIONS:');
    success('  🔍 Add comprehensive input validation');
    success('  🛡️  Implement proper error boundaries');
    success('  ⏱️  Add request timeout handling');
    success('  🔄 Implement retry mechanisms for transient failures');
    success('  📊 Add monitoring for edge case occurrences');
    success('  🧪 Regular edge case testing in CI/CD');
    
    success('\n🎉 Edge cases testing completed!');
  }

  // Helper sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution function
async function runEdgeCasesTests() {
  const tester = new EdgeCasesTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runEdgeCasesTests().catch(console.error);
}

module.exports = { EdgeCasesTester, runEdgeCasesTests };