/**
 * SV1 Performance Testing - Activity 6 Redux & Protected Routes
 * Load testing APIs với concurrent requests và performance monitoring
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:5000';
const CONCURRENT_REQUESTS = 10;
const TEST_DURATION_MS = 30000; // 30 seconds
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

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
 * PERFORMANCE TESTING CLASS
 */
class PerformanceTester {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
    this.testResults = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      endpoints: {}
    };
  }

  async runAllTests() {
    section('SV1 PERFORMANCE TESTING - Activity 6 Redux APIs');
    
    try {
      // Step 1: Setup authentication tokens
      await this.setupAuthentication();
      
      // Step 2: Individual endpoint performance tests
      await this.testIndividualEndpoints();
      
      // Step 3: Concurrent load testing
      await this.runConcurrentLoadTests();
      
      // Step 4: Stress testing
      await this.runStressTests();
      
      // Step 5: Generate performance report
      await this.generatePerformanceReport();
      
    } catch (error) {
      error(`Performance testing failed: ${error.message}`);
    }
  }

  // Setup authentication tokens for testing
  async setupAuthentication() {
    section('PHASE 1: AUTHENTICATION SETUP');
    
    try {
      // Login as admin
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@group10.com',
        password: 'AdminPassword123!'
      });
      
      this.adminToken = adminLogin.data.accessToken;
      success('Admin token obtained');
      
      // Login as user
      const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'user@group10.com', 
        password: 'UserPassword123!'
      });
      
      this.userToken = userLogin.data.accessToken;
      success('User token obtained');
      
    } catch (err) {
      throw new Error(`Authentication setup failed: ${err.message}`);
    }
  }

  // Test individual endpoints for baseline performance
  async testIndividualEndpoints() {
    section('PHASE 2: INDIVIDUAL ENDPOINT PERFORMANCE');
    
    const endpoints = [
      {
        name: 'Token Verification',
        method: 'GET',
        url: '/api/verify-token',
        headers: { Authorization: `Bearer ${this.adminToken}` }
      },
      {
        name: 'User Profile',
        method: 'GET', 
        url: '/api/profile',
        headers: { Authorization: `Bearer ${this.userToken}` }
      },
      {
        name: 'Admin Dashboard',
        method: 'GET',
        url: '/api/admin/dashboard',
        headers: { Authorization: `Bearer ${this.adminToken}` }
      },
      {
        name: 'Admin Users List',
        method: 'GET',
        url: '/api/admin/users',
        headers: { Authorization: `Bearer ${this.adminToken}` }
      },
      {
        name: 'Route Access Check',
        method: 'POST',
        url: '/api/check-access',
        headers: { 
          Authorization: `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        data: { route: '/admin' }
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointPerformance(endpoint);
      await this.sleep(500); // Brief pause between endpoint tests
    }
  }

  // Test single endpoint performance
  async testEndpointPerformance(endpoint, iterations = 5) {
    info(`Testing ${endpoint.name}...`);
    
    const responseTimes = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          headers: endpoint.headers,
          data: endpoint.data,
          timeout: 10000
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        responseTimes.push(responseTime);
        successCount++;
        
        // Record response size for analysis
        const responseSize = JSON.stringify(response.data).length;
        
      } catch (err) {
        errorCount++;
        this.testResults.errors.push(`${endpoint.name}: ${err.message}`);
      }
    }
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    this.testResults.endpoints[endpoint.name] = {
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      successCount,
      errorCount,
      successRate: (successCount / iterations) * 100
    };
    
    success(`${endpoint.name}: Avg ${avgResponseTime.toFixed(2)}ms, Success: ${successCount}/${iterations}`);
  }

  // Run concurrent load tests
  async runConcurrentLoadTests() {
    section('PHASE 3: CONCURRENT LOAD TESTING');
    
    const testScenarios = [
      {
        name: 'Admin Dashboard Load Test',
        endpoint: '/api/admin/dashboard',
        method: 'GET',
        headers: { Authorization: `Bearer ${this.adminToken}` },
        concurrency: 20,
        requests: 100
      },
      {
        name: 'Token Verification Load Test',
        endpoint: '/api/verify-token',
        method: 'GET', 
        headers: { Authorization: `Bearer ${this.userToken}` },
        concurrency: 50,
        requests: 200
      },
      {
        name: 'Mixed Endpoint Load Test',
        endpoint: 'mixed',
        concurrency: 30,
        requests: 150
      }
    ];

    for (const scenario of testScenarios) {
      await this.runLoadTestScenario(scenario);
      await this.sleep(2000); // Pause between load tests
    }
  }

  // Run single load test scenario
  async runLoadTestScenario(scenario) {
    info(`Running ${scenario.name}...`);
    
    const startTime = performance.now();
    const promises = [];
    
    for (let i = 0; i < scenario.requests; i++) {
      if (scenario.endpoint === 'mixed') {
        // Mixed endpoint testing
        const endpoints = [
          { url: '/api/verify-token', headers: { Authorization: `Bearer ${this.adminToken}` }, method: 'GET' },
          { url: '/api/profile', headers: { Authorization: `Bearer ${this.userToken}` }, method: 'GET' },
          { url: '/api/admin/dashboard', headers: { Authorization: `Bearer ${this.adminToken}` }, method: 'GET' }
        ];
        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        
        promises.push(this.makeRequest(randomEndpoint));
      } else {
        promises.push(this.makeRequest(scenario));
      }
      
      // Control concurrency
      if (promises.length >= scenario.concurrency) {
        await Promise.allSettled(promises);
        promises.length = 0; // Clear array
        await this.sleep(10); // Brief pause
      }
    }
    
    // Wait for remaining requests
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    success(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
    
    // Calculate requests per second
    const requestsPerSecond = (scenario.requests / (totalTime / 1000)).toFixed(2);
    info(`Requests per second: ${requestsPerSecond}`);
  }

  // Make individual request with timing
  async makeRequest(config) {
    const requestStartTime = performance.now();
    
    try {
      const response = await axios({
        method: config.method || 'GET',
        url: `${BASE_URL}${config.endpoint || config.url}`,
        headers: config.headers,
        data: config.data,
        timeout: 15000
      });
      
      const requestEndTime = performance.now();
      const responseTime = requestEndTime - requestStartTime;
      
      this.testResults.totalRequests++;
      this.testResults.successfulRequests++;
      this.testResults.responseTimes.push(responseTime);
      
      return { success: true, responseTime, status: response.status };
      
    } catch (error) {
      const requestEndTime = performance.now();
      const responseTime = requestEndTime - requestStartTime;
      
      this.testResults.totalRequests++;
      this.testResults.failedRequests++;
      this.testResults.responseTimes.push(responseTime);
      this.testResults.errors.push(error.message);
      
      return { success: false, responseTime, error: error.message };
    }
  }

  // Run stress tests with increasing load
  async runStressTests() {
    section('PHASE 4: STRESS TESTING');
    
    const stressLevels = [10, 25, 50, 100, 150];
    
    for (const concurrency of stressLevels) {
      info(`Stress testing with ${concurrency} concurrent requests...`);
      
      const stressStartTime = performance.now();
      const promises = [];
      
      // Create concurrent requests
      for (let i = 0; i < concurrency; i++) {
        promises.push(this.makeRequest({
          url: '/api/admin/dashboard',
          headers: { Authorization: `Bearer ${this.adminToken}` }
        }));
      }
      
      const results = await Promise.allSettled(promises);
      const stressEndTime = performance.now();
      
      // Analyze stress test results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      const avgTime = (stressEndTime - stressStartTime) / results.length;
      
      info(`Concurrency ${concurrency}: ${successful}/${results.length} success, Avg: ${avgTime.toFixed(2)}ms`);
      
      // Check if server is still responsive
      if (successful < results.length * 0.8) {
        warning(`High failure rate at concurrency ${concurrency}: ${failed} failures`);
      }
      
      await this.sleep(3000); // Recovery time between stress levels
    }
  }

  // Generate comprehensive performance report
  async generatePerformanceReport() {
    section('PHASE 5: PERFORMANCE REPORT');
    
    // Calculate overall statistics
    const totalResponseTime = this.testResults.responseTimes.reduce((a, b) => a + b, 0);
    const avgResponseTime = totalResponseTime / this.testResults.responseTimes.length;
    const minResponseTime = Math.min(...this.testResults.responseTimes);
    const maxResponseTime = Math.max(...this.testResults.responseTimes);
    const successRate = (this.testResults.successfulRequests / this.testResults.totalRequests) * 100;
    
    // Calculate percentiles
    const sortedTimes = [...this.testResults.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    // Display report
    success('='.repeat(60));
    success('PERFORMANCE TEST SUMMARY REPORT');
    success('='.repeat(60));
    
    info(`📊 Total Requests: ${this.testResults.totalRequests}`);
    info(`✅ Successful: ${this.testResults.successfulRequests}`);
    info(`❌ Failed: ${this.testResults.failedRequests}`);
    info(`📈 Success Rate: ${successRate.toFixed(2)}%`);
    
    success('\n📈 RESPONSE TIME STATISTICS:');
    info(`Average: ${avgResponseTime.toFixed(2)}ms`);
    info(`Minimum: ${minResponseTime.toFixed(2)}ms`);
    info(`Maximum: ${maxResponseTime.toFixed(2)}ms`);
    info(`50th Percentile (Median): ${p50.toFixed(2)}ms`);
    info(`90th Percentile: ${p90.toFixed(2)}ms`);
    info(`95th Percentile: ${p95.toFixed(2)}ms`);
    info(`99th Percentile: ${p99.toFixed(2)}ms`);
    
    success('\n🎯 ENDPOINT PERFORMANCE:');
    Object.entries(this.testResults.endpoints).forEach(([endpoint, stats]) => {
      info(`${endpoint}:`);
      info(`  Avg: ${stats.avgResponseTime.toFixed(2)}ms`);
      info(`  Range: ${stats.minResponseTime.toFixed(2)}ms - ${stats.maxResponseTime.toFixed(2)}ms`);
      info(`  Success Rate: ${stats.successRate.toFixed(2)}%`);
    });
    
    if (this.testResults.errors.length > 0) {
      warning('\n⚠️  ERRORS ENCOUNTERED:');
      this.testResults.errors.slice(0, 10).forEach(error => {
        error(`  ${error}`);
      });
      if (this.testResults.errors.length > 10) {
        warning(`  ... and ${this.testResults.errors.length - 10} more errors`);
      }
    }
    
    // Performance recommendations
    success('\n💡 PERFORMANCE RECOMMENDATIONS:');
    
    if (avgResponseTime > 1000) {
      warning('  Average response time > 1s - Consider optimization');
    } else {
      success('  Response times are acceptable (<1s average)');
    }
    
    if (successRate < 95) {
      warning('  Success rate < 95% - Check error handling and server stability');
    } else {
      success('  Success rate is excellent (>95%)');
    }
    
    if (p95 > 2000) {
      warning('  95th percentile > 2s - Some requests are very slow');
    } else {
      success('  95th percentile response time is good');
    }
    
    success('\n🎉 Performance testing completed!');
  }
  
  // Helper function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution function
async function runPerformanceTests() {
  const tester = new PerformanceTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { PerformanceTester, runPerformanceTests };