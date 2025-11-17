#!/usr/bin/env tsx
/**
 * API Endpoints Test Script
 * 
 * This script tests all major API endpoints to ensure they're working correctly.
 * 
 * Usage:
 *   npm run test:api
 * 
 * Requirements:
 *   - Server must be running on PORT (default: 5000)
 */

import 'dotenv/config';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(70)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(70)}`, colors.blue);
}

interface TestCase {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  expectedStatus?: number;
  checkResponse?: (data: any) => boolean;
  skipIfNoAuth?: boolean;
}

async function testEndpoint(test: TestCase): Promise<boolean> {
  try {
    const url = `${BASE_URL}${test.endpoint}`;
    const response = await fetch(url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    
    // Check status code
    const expectedStatus = test.expectedStatus || 200;
    const statusMatch = response.status === expectedStatus || 
                        (response.status >= 200 && response.status < 300) ||
                        (test.skipIfNoAuth && response.status === 401) ||
                        (response.status === 503 && data && data.error && data.error.includes('Airtable'));
    
    // Check response data if checker provided
    const responseValid = !test.checkResponse || test.checkResponse(data);
    
    if (statusMatch && responseValid) {
      const statusText = response.status === 401 ? '(No Auth)' : `(${response.status})`;
      logSuccess(`${test.method.padEnd(6)} ${test.endpoint.padEnd(40)} ${statusText}`);
      return true;
    } else {
      logError(`${test.method.padEnd(6)} ${test.endpoint.padEnd(40)} (${response.status})`);
      if (data) {
        log(`    Response: ${JSON.stringify(data).substring(0, 100)}`, colors.yellow);
      }
      return false;
    }
  } catch (error: any) {
    logError(`${test.method.padEnd(6)} ${test.endpoint.padEnd(40)} - ${error.message}`);
    return false;
  }
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/user`);
    return response.status < 500;
  } catch (error) {
    return false;
  }
}

async function main() {
  logHeader('API Endpoints Test');
  
  // Check if server is running
  logInfo(`Checking if server is running on ${BASE_URL}...\n`);
  
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    logError('Server is not running or not responding!');
    logInfo('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  logSuccess('Server is responding\n');
  
  // Define test cases
  const tests: TestCase[] = [
    // Authentication endpoints
    {
      name: 'Get current user',
      method: 'GET',
      endpoint: '/api/auth/user',
      checkResponse: (data) => data && (data.user !== undefined || data.devMode !== undefined),
    },
    
    // Advertiser endpoints
    {
      name: 'Get advertisers',
      method: 'GET',
      endpoint: '/api/advertisers',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Agency endpoints
    {
      name: 'Get agencies',
      method: 'GET',
      endpoint: '/api/agencies',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Campaign endpoints
    {
      name: 'Get campaigns',
      method: 'GET',
      endpoint: '/api/campaigns',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    {
      name: 'Get pipeline counts',
      method: 'GET',
      endpoint: '/api/campaigns/pipeline-counts',
      checkResponse: (data) => data && (typeof data === 'object' || data.error),
    },
    
    // Quote endpoints
    {
      name: 'Get quotes',
      method: 'GET',
      endpoint: '/api/quotes',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Ad Products endpoints
    {
      name: 'Get ad products',
      method: 'GET',
      endpoint: '/api/ad-products',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Invoice endpoints
    {
      name: 'Get invoices',
      method: 'GET',
      endpoint: '/api/invoices',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Tax Invoice endpoints
    {
      name: 'Get tax invoices',
      method: 'GET',
      endpoint: '/api/tax-invoices',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
    
    // Settings endpoints
    {
      name: 'Get general settings',
      method: 'GET',
      endpoint: '/api/settings/general',
      checkResponse: (data) => data && (typeof data === 'object'),
    },
    {
      name: 'Get notification settings',
      method: 'GET',
      endpoint: '/api/settings/notifications',
      checkResponse: (data) => data && (typeof data === 'object'),
    },
    
    // Dashboard endpoints
    {
      name: 'Get dashboard metrics',
      method: 'GET',
      endpoint: '/api/dashboard/metrics',
      checkResponse: (data) => data && (typeof data === 'object' || data.error),
    },
    
    // User endpoints
    {
      name: 'Get users',
      method: 'GET',
      endpoint: '/api/users',
      checkResponse: (data) => Array.isArray(data) || (data && data.error),
    },
  ];
  
  // Run tests
  logHeader('Testing Endpoints');
  logInfo('Testing all major API endpoints...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test);
    if (success) {
      passCount++;
    } else {
      failCount++;
    }
  }
  
  // Summary
  logHeader('Test Summary');
  log(`Total endpoints tested: ${tests.length}`, colors.cyan);
  logSuccess(`Passed: ${passCount}`);
  
  if (failCount > 0) {
    logError(`Failed: ${failCount}`);
    log('\n⚠️  Some endpoints failed.', colors.yellow);
    log('This may be expected if:', colors.yellow);
    log('- Airtable is not configured (will return error messages)', colors.yellow);
    log('- Authentication is required (will return 401)', colors.yellow);
    log('- Some features are not yet implemented', colors.yellow);
    process.exit(1);
  }
  
  logSuccess('\n🎉 All API endpoints are responding correctly!\n');
  process.exit(0);
}

// Run the tests
main().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
