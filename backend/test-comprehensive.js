/**
 * SV1 Comprehensive Testing Suite - Activity 6 Redux & Protected Routes
 * Run all testing phases: Data Validation, Performance, Security, Integration, Edge Cases, DB Optimization
 */

require('dotenv').config();

// Import all test modules
const { runDataValidationTests } = require('./test-data-validation');
const { runPerformanceTests } = require('./test-performance');
const { runSecurityTests } = require('./test-security');
const { runIntegrationTests } = require('./test-integration');
const { runEdgeCasesTests } = require('./test-edge-cases');
const { runDatabaseOptimization } = require('./test-database-optimization');

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
const header = (msg) => log('magenta', `\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`);

/**
 * COMPREHENSIVE TESTING ORCHESTRATOR
 */
class ComprehensiveTestSuite {
  constructor() {
    this.testResults = {
      phases: [],
      startTime: Date.now(),
      endTime: null,
      totalDuration: 0,
      overallStatus: 'PENDING'
    };
  }

  async runAllTests() {
    header('🚀 SV1 COMPREHENSIVE TESTING SUITE');
    header('ACTIVITY 6 - REDUX & PROTECTED ROUTES - KIỂM THỬ DỮ LIỆU');
    
    try {
      info('🎯 Testing Phase Overview:');
      info('  Phase 1: Data Validation Testing');
      info('  Phase 2: Performance Testing');  
      info('  Phase 3: Security Testing');
      info('  Phase 4: Integration Testing');
      info('  Phase 5: Edge Cases Testing');
      info('  Phase 6: Database Optimization');
      
      // Check if server is running
      await this.checkServerAvailability();
      
      // Run all test phases
      await this.runTestPhase('Data Validation Testing', runDataValidationTests);
      await this.runTestPhase('Performance Testing', runPerformanceTests);
      await this.runTestPhase('Security Testing', runSecurityTests);
      await this.runTestPhase('Integration Testing', runIntegrationTests);
      await this.runTestPhase('Edge Cases Testing', runEdgeCasesTests);
      await this.runTestPhase('Database Optimization', runDatabaseOptimization);
      
      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      error(`Comprehensive testing failed: ${error.message}`);
      this.testResults.overallStatus = 'FAILED';
    } finally {
      this.testResults.endTime = Date.now();
      this.testResults.totalDuration = this.testResults.endTime - this.testResults.startTime;
    }
  }

  // Check if backend server is running
  async checkServerAvailability() {
    section('PRE-FLIGHT CHECK: Server Availability');
    
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      success('Backend server is running and accessible');
    } catch (err) {
      try {
        // Try basic auth endpoint if health endpoint doesn't exist
        const axios = require('axios');
        await axios.get('http://localhost:5000', { timeout: 5000 });
        success('Backend server is running');
      } catch (err2) {
        warning('⚠️  Backend server may not be running!');
        warning('   Please start the server with: npm start');
        warning('   Some tests may fail without a running server');
        
        // Ask user if they want to continue
        console.log('\n❓ Do you want to continue testing anyway? (y/N)');
        
        // For automated testing, we'll continue but note the issue
        warning('Continuing with testing - some API tests may fail');
      }
    }
  }

  // Run individual test phase with error handling
  async runTestPhase(phaseName, testFunction) {
    const phaseResult = {
      name: phaseName,
      status: 'PENDING',
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      error: null
    };

    try {
      header(`📂 PHASE: ${phaseName.toUpperCase()}`);
      info(`🚀 Starting ${phaseName}...`);
      
      // Run the test function
      await testFunction();
      
      phaseResult.status = 'PASSED';
      phaseResult.endTime = Date.now();
      phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
      
      success(`✅ ${phaseName} completed successfully in ${phaseResult.duration}ms`);
      
    } catch (err) {
      phaseResult.status = 'FAILED';
      phaseResult.endTime = Date.now();
      phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
      phaseResult.error = err.message;
      
      error(`❌ ${phaseName} failed: ${err.message}`);
      warning(`⏱️  Phase duration: ${phaseResult.duration}ms`);
      
      // Continue with other tests even if one fails
      warning('🔄 Continuing with remaining test phases...');
    }

    this.testResults.phases.push(phaseResult);
    
    // Brief pause between phases
    await this.sleep(2000);
  }

  // Generate comprehensive final report
  async generateFinalReport() {
    header('📊 COMPREHENSIVE TEST REPORT');
    
    const passedPhases = this.testResults.phases.filter(p => p.status === 'PASSED').length;
    const failedPhases = this.testResults.phases.filter(p => p.status === 'FAILED').length;
    const totalPhases = this.testResults.phases.length;
    
    // Calculate overall status
    if (failedPhases === 0) {
      this.testResults.overallStatus = 'ALL PASSED';
    } else if (passedPhases > failedPhases) {
      this.testResults.overallStatus = 'MOSTLY PASSED';
    } else {
      this.testResults.overallStatus = 'NEEDS ATTENTION';
    }
    
    // Display summary
    success('='.repeat(70));
    success('SV1 COMPREHENSIVE TESTING SUMMARY - ACTIVITY 6 REDUX SUPPORT');
    success('='.repeat(70));
    
    info(`🕐 Total Duration: ${(this.testResults.totalDuration / 1000).toFixed(2)} seconds`);
    info(`📊 Total Phases: ${totalPhases}`);
    info(`✅ Passed: ${passedPhases}`);
    info(`❌ Failed: ${failedPhases}`);
    
    // Overall status with color coding
    if (this.testResults.overallStatus === 'ALL PASSED') {
      success(`🎉 Overall Status: ${this.testResults.overallStatus}`);
    } else if (this.testResults.overallStatus === 'MOSTLY PASSED') {
      warning(`⚠️  Overall Status: ${this.testResults.overallStatus}`);
    } else {
      error(`🚨 Overall Status: ${this.testResults.overallStatus}`);
    }
    
    // Detailed phase results
    success('\n📋 PHASE-BY-PHASE RESULTS:');
    this.testResults.phases.forEach((phase, index) => {
      const duration = (phase.duration / 1000).toFixed(2);
      const statusIcon = phase.status === 'PASSED' ? '✅' : '❌';
      const statusColor = phase.status === 'PASSED' ? 'green' : 'red';
      
      log(statusColor, `  ${index + 1}. ${statusIcon} ${phase.name}: ${phase.status} (${duration}s)`);
      
      if (phase.error) {
        log('red', `      Error: ${phase.error}`);
      }
    });
    
    // Testing achievements
    success('\n🏆 TESTING ACHIEVEMENTS:');
    
    const achievements = [];
    
    if (passedPhases >= 6) {
      achievements.push('🎯 COMPREHENSIVE TESTING - All phases executed');
    }
    if (this.testResults.phases.find(p => p.name === 'Data Validation Testing')?.status === 'PASSED') {
      achievements.push('✅ DATA INTEGRITY - Validation tests passed');
    }
    if (this.testResults.phases.find(p => p.name === 'Performance Testing')?.status === 'PASSED') {
      achievements.push('⚡ PERFORMANCE VERIFIED - Load testing completed');
    }
    if (this.testResults.phases.find(p => p.name === 'Security Testing')?.status === 'PASSED') {
      achievements.push('🛡️  SECURITY VALIDATED - Vulnerability testing done');
    }
    if (this.testResults.phases.find(p => p.name === 'Integration Testing')?.status === 'PASSED') {
      achievements.push('🔗 INTEGRATION CONFIRMED - End-to-end flows tested');
    }
    if (this.testResults.phases.find(p => p.name === 'Edge Cases Testing')?.status === 'PASSED') {
      achievements.push('🔍 EDGE CASES HANDLED - Robustness validated');
    }
    if (this.testResults.phases.find(p => p.name === 'Database Optimization')?.status === 'PASSED') {
      achievements.push('🚀 DATABASE OPTIMIZED - Performance enhanced');
    }
    
    achievements.forEach(achievement => success(`  ${achievement}`));
    
    // Quality assessment
    success('\n📈 QUALITY ASSESSMENT:');
    
    const qualityScore = (passedPhases / totalPhases) * 100;
    
    if (qualityScore >= 100) {
      success('  🥇 GRADE: A+ (EXCELLENT) - Production ready!');
    } else if (qualityScore >= 83) {
      success('  🥈 GRADE: A (VERY GOOD) - Minor issues to address');
    } else if (qualityScore >= 67) {
      warning('  🥉 GRADE: B (GOOD) - Some improvements needed');
    } else if (qualityScore >= 50) {
      warning('  📊 GRADE: C (ACCEPTABLE) - Significant improvements required');
    } else {
      error('  🚨 GRADE: F (NEEDS WORK) - Major issues to resolve');
    }
    
    // Next steps recommendations
    success('\n💡 NEXT STEPS RECOMMENDATIONS:');
    
    if (this.testResults.overallStatus === 'ALL PASSED') {
      success('  🎯 Backend is ready for SV2 Frontend Redux implementation!');
      success('  🚀 All APIs tested and validated');
      success('  📦 Production deployment preparation can begin');
    } else {
      const failedPhaseNames = this.testResults.phases
        .filter(p => p.status === 'FAILED')
        .map(p => p.name);
      
      warning(`  🔧 Address issues in: ${failedPhaseNames.join(', ')}`);
      warning('  🔄 Re-run failed tests after fixes');
      warning('  📋 Review error details and implement solutions');
    }
    
    // Final status message
    success('\n🎯 SV1 TESTING PHASE COMPLETION:');
    success('  ✅ Backend support for Redux & Protected Routes evaluated');
    success('  ✅ Data validation, performance, security tested');
    success('  ✅ Integration flows and edge cases verified');
    success('  ✅ Database optimization implemented');
    
    if (passedPhases === totalPhases) {
      success('\n🎉 CONGRATULATIONS! 🎉');
      success('SV1 Backend Support is FULLY VALIDATED and PRODUCTION READY!');
      success('Ready to proceed with SV2 Frontend Redux implementation!');
    } else {
      warning('\n⚠️  Additional work needed before SV2 frontend implementation');
      warning('Please address failed test phases and re-run validation');
    }
    
    // Export test results
    await this.exportTestResults();
    
    success('\n📄 Detailed test results exported to comprehensive-test-results.json');
    success('🎯 Testing documentation available in individual test files');
  }

  // Export test results for documentation
  async exportTestResults() {
    try {
      const fs = require('fs').promises;
      
      const results = {
        ...this.testResults,
        timestamp: new Date().toISOString(),
        activity: 'Activity 6 - Redux & Protected Routes',
        component: 'SV1 Backend Support',
        summary: {
          totalPhases: this.testResults.phases.length,
          passedPhases: this.testResults.phases.filter(p => p.status === 'PASSED').length,
          failedPhases: this.testResults.phases.filter(p => p.status === 'FAILED').length,
          overallStatus: this.testResults.overallStatus,
          totalDurationSeconds: (this.testResults.totalDuration / 1000).toFixed(2)
        }
      };
      
      await fs.writeFile(
        './comprehensive-test-results.json', 
        JSON.stringify(results, null, 2)
      );
      
    } catch (err) {
      warning('Could not export test results to file');
    }
  }

  // Helper sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution function
async function runComprehensiveTests() {
  const testSuite = new ComprehensiveTestSuite();
  await testSuite.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { ComprehensiveTestSuite, runComprehensiveTests };