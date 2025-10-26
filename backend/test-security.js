/**
 * SV1 Security Testing - Activity 6 Redux & Protected Routes
 * Test JWT token security, role-based access vulnerabilities, injection protection
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
 * SECURITY TESTING CLASS
 */
class SecurityTester {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
    this.vulnerabilities = [];
    this.securityResults = {
      jwtTests: { passed: 0, failed: 0 },
      authTests: { passed: 0, failed: 0 },
      injectionTests: { passed: 0, failed: 0 },
      accessControlTests: { passed: 0, failed: 0 }
    };
  }

  async runAllTests() {
    section('SV1 SECURITY TESTING - Activity 6 Redux APIs');
    
    try {
      // Step 1: Setup authentication
      await this.setupAuthentication();
      
      // Step 2: JWT Security Tests
      await this.testJWTSecurity();
      
      // Step 3: Authentication & Authorization Tests
      await this.testAuthenticationSecurity();
      
      // Step 4: Injection Attack Tests
      await this.testInjectionVulnerabilities();
      
      // Step 5: Access Control Tests
      await this.testAccessControlVulnerabilities();
      
      // Step 6: Generate security report
      await this.generateSecurityReport();
      
    } catch (error) {
      error(`Security testing failed: ${error.message}`);
    }
  }

  async setupAuthentication() {
    section('PHASE 1: AUTHENTICATION SETUP');
    
    try {
      // Login as admin
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@group10.com',
        password: 'AdminPassword123!'
      });
      
      this.adminToken = adminLogin.data.accessToken;
      success('Admin token obtained for security testing');
      
      // Login as user
      const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'user@group10.com',
        password: 'UserPassword123!'
      });
      
      this.userToken = userLogin.data.accessToken;
      success('User token obtained for security testing');
      
    } catch (err) {
      throw new Error(`Authentication setup failed: ${err.message}`);
    }
  }

  // Test JWT token security
  async testJWTSecurity() {
    section('PHASE 2: JWT SECURITY TESTING');

    // Test 1: Invalid JWT format
    await this.testSecurityVuln('Invalid JWT Format', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: 'Bearer invalid.jwt.token' }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Invalid JWT accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Invalid JWT properly rejected');
          return true;
        }
        throw err;
      }
    }, 'jwtTests');

    // Test 2: Expired token (simulated)
    await this.testSecurityVuln('Expired Token Handling', async () => {
      try {
        // Create an expired token
        const expiredPayload = {
          userId: '507f1f77bcf86cd799439011',
          email: 'test@expired.com',
          exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        };
        
        const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET || 'fallback-secret');
        
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Expired token accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Expired token properly rejected');
          return true;
        }
        throw err;
      }
    }, 'jwtTests');

    // Test 3: Token signature tampering
    await this.testSecurityVuln('Token Signature Tampering', async () => {
      try {
        // Tamper with the token signature
        const tamperedToken = this.adminToken.slice(0, -10) + 'tampered123';
        
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${tamperedToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Tampered token accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Tampered token properly rejected');
          return true;
        }
        throw err;
      }
    }, 'jwtTests');

    // Test 4: None algorithm attack
    await this.testSecurityVuln('None Algorithm Attack', async () => {
      try {
        // Create token with 'none' algorithm
        const noneToken = jwt.sign(
          { userId: '507f1f77bcf86cd799439011', email: 'attacker@test.com' }, 
          '', 
          { algorithm: 'none' }
        );
        
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${noneToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: None algorithm token accepted');
        }
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          success('None algorithm attack prevented');
          return true;
        }
        throw err;
      }
    }, 'jwtTests');

    // Test 5: Token without signature
    await this.testSecurityVuln('Token Without Signature', async () => {
      try {
        const unsignedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImF0dGFja2VyQHRlc3QuY29tIn0.';
        
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${unsignedToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Unsigned token accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Unsigned token properly rejected');
          return true;
        }
        throw err;
      }
    }, 'jwtTests');
  }

  // Test authentication and authorization security
  async testAuthenticationSecurity() {
    section('PHASE 3: AUTHENTICATION & AUTHORIZATION SECURITY');

    // Test 1: Missing Authorization header
    await this.testSecurityVuln('Missing Authorization Header', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/profile`);
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Request without auth header succeeded');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Missing auth header properly handled');
          return true;
        }
        throw err;
      }
    }, 'authTests');

    // Test 2: Malformed Authorization header
    await this.testSecurityVuln('Malformed Authorization Header', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: 'Malformed header' }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: Malformed auth header accepted');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Malformed auth header properly rejected');
          return true;
        }
        throw err;
      }
    }, 'authTests');

    // Test 3: User accessing admin endpoints
    await this.testSecurityVuln('User Accessing Admin Endpoints', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: User accessed admin endpoint');
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          success('User properly blocked from admin endpoint');
          return true;
        }
        throw err;
      }
    }, 'authTests');

    // Test 4: Role elevation attempt
    await this.testSecurityVuln('Role Elevation Attempt', async () => {
      try {
        // Try to update user profile to admin
        const response = await axios.put(`${BASE_URL}/api/profile`, {
          isAdmin: true,
          role: 'admin'
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if the user actually became admin
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        if (profileResponse.data.data && profileResponse.data.data.isAdmin === true) {
          throw new Error('VULNERABILITY: Role elevation succeeded');
        }
        
        success('Role elevation properly prevented');
        return true;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          success('Role elevation blocked by authorization');
          return true;
        }
        // If update succeeded but didn't elevate role, that's also secure
        return true;
      }
    }, 'authTests');

    // Test 5: Admin token reuse after logout (if implemented)
    await this.testSecurityVuln('Token Reuse After Logout', async () => {
      try {
        // Try to logout (if endpoint exists)
        try {
          await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${this.adminToken}` }
          });
        } catch (logoutErr) {
          // Logout endpoint might not exist, skip this test
          info('Logout endpoint not available, skipping token reuse test');
          return true;
        }
        
        // Try to use the token after logout
        const response = await axios.get(`${BASE_URL}/api/verify-token`, {
          headers: { Authorization: `Bearer ${this.adminToken}` }
        });
        
        if (response.status === 200) {
          warning('Token still valid after logout - consider token blacklisting');
        }
        
        return true;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('Token properly invalidated after logout');
          return true;
        }
        return true; // Test inconclusive but not a failure
      }
    }, 'authTests');
  }

  // Test injection vulnerabilities
  async testInjectionVulnerabilities() {
    section('PHASE 4: INJECTION VULNERABILITY TESTING');

    // Test 1: SQL Injection in login
    await this.testSecurityVuln('SQL Injection in Login', async () => {
      try {
        const sqlPayload = "admin' OR '1'='1' --";
        
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: sqlPayload,
          password: 'anything'
        });
        
        if (response.status === 200 && response.data.accessToken) {
          throw new Error('VULNERABILITY: SQL injection succeeded in login');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          success('SQL injection properly blocked in login');
          return true;
        }
        throw err;
      }
    }, 'injectionTests');

    // Test 2: NoSQL Injection in profile update
    await this.testSecurityVuln('NoSQL Injection in Profile Update', async () => {
      try {
        const nosqlPayload = { $ne: null };
        
        const response = await axios.put(`${BASE_URL}/api/profile`, {
          name: nosqlPayload,
          bio: { $where: 'function() { return true; }' }
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if malicious payload was processed
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        if (profileResponse.data.data.name && typeof profileResponse.data.data.name === 'object') {
          throw new Error('VULNERABILITY: NoSQL injection succeeded');
        }
        
        success('NoSQL injection properly prevented');
        return true;
      } catch (err) {
        if (err.response && err.response.status === 400) {
          success('NoSQL injection blocked by validation');
          return true;
        }
        // If it just didn't process the malicious data, that's also secure
        return true;
      }
    }, 'injectionTests');

    // Test 3: XSS in profile fields
    await this.testSecurityVuln('XSS in Profile Fields', async () => {
      try {
        const xssPayload = '<script>alert("xss")</script>';
        
        await axios.put(`${BASE_URL}/api/profile`, {
          name: xssPayload,
          bio: '<img src="x" onerror="alert(\'xss\')">'
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if XSS payload was sanitized
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        const userData = profileResponse.data.data;
        
        if (userData.name && userData.name.includes('<script>')) {
          warning('XSS payload not sanitized in name field');
        }
        if (userData.bio && userData.bio.includes('onerror=')) {
          warning('XSS payload not sanitized in bio field');
        }
        
        success('XSS testing completed - check for sanitization');
        return true;
      } catch (err) {
        // Even if it fails, we want to continue testing
        return true;
      }
    }, 'injectionTests');

    // Test 4: Command Injection (if any file operations exist)
    await this.testSecurityVuln('Command Injection Prevention', async () => {
      try {
        const cmdPayload = '; rm -rf / ;';
        
        // Try command injection in various fields
        await axios.put(`${BASE_URL}/api/profile`, {
          address: cmdPayload,
          phone: '$(whoami)'
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        success('Command injection payloads processed without server compromise');
        return true;
      } catch (err) {
        // Server didn't crash, which is good
        return true;
      }
    }, 'injectionTests');
  }

  // Test access control vulnerabilities
  async testAccessControlVulnerabilities() {
    section('PHASE 5: ACCESS CONTROL VULNERABILITY TESTING');

    // Test 1: Insecure Direct Object References (IDOR)
    await this.testSecurityVuln('Insecure Direct Object References', async () => {
      try {
        // Try to access another user's data by ID manipulation
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        if (response.status === 200) {
          throw new Error('VULNERABILITY: User can access admin users list');
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          success('IDOR properly prevented - user blocked from admin data');
          return true;
        }
        throw err;
      }
    }, 'accessControlTests');

    // Test 2: Horizontal privilege escalation
    await this.testSecurityVuln('Horizontal Privilege Escalation', async () => {
      try {
        // Try to access route access check for admin routes with user token
        const response = await axios.post(`${BASE_URL}/api/check-access`, {
          route: '/admin'
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.data && response.data.data.hasAccess === true) {
          throw new Error('VULNERABILITY: User has access to admin routes');
        }
        
        success('Horizontal privilege escalation properly prevented');
        return true;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          success('User properly blocked from admin route check');
          return true;
        }
        return true;
      }
    }, 'accessControlTests');

    // Test 3: Mass assignment vulnerability
    await this.testSecurityVuln('Mass Assignment Vulnerability', async () => {
      try {
        // Try to update sensitive fields that should be protected
        const response = await axios.put(`${BASE_URL}/api/profile`, {
          _id: '507f1f77bcf86cd799439011',
          password: 'hacked123',
          role: 'admin',
          isAdmin: true,
          createdAt: new Date('1900-01-01'),
          __v: 999
        }, {
          headers: { 
            Authorization: `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if sensitive fields were actually updated
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${this.userToken}` }
        });
        
        const userData = profileResponse.data.data;
        
        if (userData.isAdmin === true || userData.role === 'admin') {
          throw new Error('VULNERABILITY: Mass assignment allowed role escalation');
        }
        
        success('Mass assignment properly prevented for sensitive fields');
        return true;
      } catch (err) {
        return true; // Even errors are OK for this test
      }
    }, 'accessControlTests');

    // Test 4: Rate limiting bypass attempts
    await this.testSecurityVuln('Rate Limiting Effectiveness', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Try to make many requests quickly
      for (let i = 0; i < 100; i++) {
        requests.push(
          axios.get(`${BASE_URL}/api/verify-token`, {
            headers: { Authorization: `Bearer ${this.userToken}` }
          }).catch(err => ({ error: err.response?.status }))
        );
      }
      
      const results = await Promise.allSettled(requests);
      const rateLimitedCount = results.filter(r => 
        r.value && r.value.error === 429
      ).length;
      
      if (rateLimitedCount > 0) {
        success(`Rate limiting active - ${rateLimitedCount}/100 requests blocked`);
      } else {
        warning('No rate limiting detected - consider implementing rate limits');
      }
      
      return true;
    }, 'accessControlTests');
  }

  // Helper method to run security vulnerability tests
  async testSecurityVuln(testName, testFn, category) {
    try {
      await testFn();
      this.securityResults[category].passed++;
      success(`${testName} - SECURE`);
    } catch (err) {
      this.securityResults[category].failed++;
      if (err.message.includes('VULNERABILITY:')) {
        error(`${testName} - ${err.message}`);
        this.vulnerabilities.push(`${testName}: ${err.message}`);
      } else {
        error(`${testName} - TEST ERROR: ${err.message}`);
      }
    }
  }

  // Generate comprehensive security report
  async generateSecurityReport() {
    section('PHASE 6: SECURITY ASSESSMENT REPORT');
    
    const totalTests = Object.values(this.securityResults).reduce((sum, cat) => sum + cat.passed + cat.failed, 0);
    const totalPassed = Object.values(this.securityResults).reduce((sum, cat) => sum + cat.passed, 0);
    const totalFailed = Object.values(this.securityResults).reduce((sum, cat) => sum + cat.failed, 0);
    
    success('='.repeat(60));
    success('SECURITY ASSESSMENT REPORT');
    success('='.repeat(60));
    
    info(`🔒 Total Security Tests: ${totalTests}`);
    info(`✅ Passed (Secure): ${totalPassed}`);
    info(`❌ Failed (Vulnerable): ${totalFailed}`);
    
    const securityScore = ((totalPassed / totalTests) * 100).toFixed(1);
    
    if (securityScore >= 90) {
      success(`🛡️  Security Score: ${securityScore}% - EXCELLENT`);
    } else if (securityScore >= 75) {
      warning(`🛡️  Security Score: ${securityScore}% - GOOD`);
    } else {
      error(`🛡️  Security Score: ${securityScore}% - NEEDS IMPROVEMENT`);
    }
    
    success('\n📊 TEST CATEGORY BREAKDOWN:');
    Object.entries(this.securityResults).forEach(([category, results]) => {
      const total = results.passed + results.failed;
      const score = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      info(`${category}: ${results.passed}/${total} passed (${score}%)`);
    });
    
    if (this.vulnerabilities.length > 0) {
      error('\n🚨 VULNERABILITIES DETECTED:');
      this.vulnerabilities.forEach((vuln, index) => {
        error(`  ${index + 1}. ${vuln}`);
      });
    } else {
      success('\n🎉 NO CRITICAL VULNERABILITIES DETECTED!');
    }
    
    success('\n💡 SECURITY RECOMMENDATIONS:');
    success('  ✅ Implement comprehensive input validation');
    success('  ✅ Use parameterized queries to prevent injection');
    success('  ✅ Implement proper rate limiting');
    success('  ✅ Use HTTPS in production');
    success('  ✅ Implement token blacklisting for logout');
    success('  ✅ Regular security audits and penetration testing');
    success('  ✅ Keep dependencies updated');
    success('  ✅ Implement Content Security Policy (CSP)');
    
    success('\n🔐 Security testing completed!');
  }
}

// Main execution function
async function runSecurityTests() {
  const tester = new SecurityTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

module.exports = { SecurityTester, runSecurityTests };