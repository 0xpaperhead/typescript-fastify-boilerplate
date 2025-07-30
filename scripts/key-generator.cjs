#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');
const { createJwt } = require('../dist/server/helpers.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

function generateSecureApiKey() {
  // Generate a more structured API key with prefix
  const prefix = 'sk-proj';
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `${prefix}-${randomPart}`;
}

async function generateJwtToken(issuer, expiryMinutes = 1) {
  try {
    // Override the createJwt function to support custom expiry
    const jwt = require('jsonwebtoken');
    const { Config } = require('../dist/config/index.js');
    
    const payloadData = {
      iss: issuer || "paperheadInt",
      exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
    };
    
    return new Promise((resolve, reject) => {
      jwt.sign(payloadData, Config.server.apiKey, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  } catch (error) {
    console.error('Error generating JWT:', error.message);
    console.log('Make sure to run "npm run build" first!');
    process.exit(1);
  }
}

function displayMenu() {
  console.log('\n🔐 Token Metadata Service - Key Generator\n');
  console.log('1. Generate JWT Token (for API testing)');
  console.log('2. Generate API Key (for INTERNAL_API_KEY)');
  console.log('3. Generate Secure API Key (with prefix)');
  console.log('4. Generate Custom JWT Token');
  console.log('5. Generate Service JWT (long-lived)');
  console.log('6. Generate Permanent Service JWT (never expires)');
  console.log('7. Exit\n');
}

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function handleJwtGeneration() {
  const issuer = await askQuestion('Enter issuer name (default: test-client): ');
  const expiryStr = await askQuestion('Enter token expiry in minutes (default: 1): ');
  
  const finalIssuer = issuer || 'test-client';
  const expiry = parseInt(expiryStr) || 1;
  
  try {
    const token = await generateJwtToken(finalIssuer, expiry);
    console.log('\n✅ JWT Token generated successfully!\n');
    console.log('Token:');
    console.log(token);
    console.log('\n📋 Use with curl:');
    console.log(`curl -X POST http://localhost:8082/ping \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"ip_address": "8.8.8.8"}'`);
    console.log(`\n⏱️  Token expires in ${expiry} minute(s)`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  let running = true;
  
  while (running) {
    displayMenu();
    const choice = await askQuestion('Select an option (1-7): ');
    
    switch (choice) {
      case '1':
        // Quick JWT generation with defaults
        try {
          const token = await generateJwtToken('test-client', 1);
          console.log('\n✅ JWT Token generated successfully!\n');
          console.log('Token:');
          console.log(token);
          console.log('\n📋 Use with curl:');
          console.log(`curl -X POST http://localhost:8082/ping \\`);
          console.log(`  -H "Authorization: Bearer ${token}" \\`);
          console.log(`  -H "Content-Type: application/json" \\`);
          console.log(`  -d '{"ip_address": "8.8.8.8"}'`);
          console.log('\n⏱️  Token expires in 1 minute');
        } catch (error) {
          console.error('Error:', error.message);
        }
        break;
        
      case '2':
        const apiKey = generateApiKey();
        console.log('\n✅ API Key generated successfully!\n');
        console.log('API Key:');
        console.log(apiKey);
        console.log('\n📝 Add this to your .env file:');
        console.log(`INTERNAL_API_KEY=${apiKey}`);
        break;
        
      case '3':
        const secureKey = generateSecureApiKey();
        console.log('\n✅ Secure API Key generated successfully!\n');
        console.log('API Key:');
        console.log(secureKey);
        console.log('\n📝 Add this to your .env file:');
        console.log(`INTERNAL_API_KEY=${secureKey}`);
        break;
        
      case '4':
        await handleJwtGeneration();
        break;
        
      case '5':
        // Generate long-lived service JWT
        const serviceName = await askQuestion('Enter service name: ');
        const daysStr = await askQuestion('Enter token validity in days (default: 365): ');
        const days = parseInt(daysStr) || 365;
        
        try {
          const { createServiceJwt } = require('../dist/server/helpers.js');
          const token = await createServiceJwt(serviceName || 'api-service', days);
          console.log('\n✅ Service JWT generated successfully!\n');
          console.log('Token:');
          console.log(token);
          console.log('\n📋 Use in server-to-server communication:');
          console.log(`Authorization: Bearer ${token}`);
          console.log(`\n⏱️  Token expires in ${days} days`);
          console.log('\n⚠️  Store this token securely! It has a long lifetime.');
        } catch (error) {
          console.error('Error:', error.message);
        }
        break;
        
      case '6':
        // Generate permanent service JWT
        const permServiceName = await askQuestion('Enter service name: ');
        const confirm = await askQuestion('⚠️  WARNING: This token NEVER expires. Continue? (yes/no): ');
        
        if (confirm.toLowerCase() === 'yes') {
          try {
            const { createPermanentServiceJwt } = require('../dist/server/helpers.js');
            const token = await createPermanentServiceJwt(permServiceName || 'api-service');
            console.log('\n✅ Permanent Service JWT generated successfully!\n');
            console.log('Token:');
            console.log(token);
            console.log('\n📋 Use in server-to-server communication:');
            console.log(`Authorization: Bearer ${token}`);
            console.log('\n⚠️  CRITICAL: This token NEVER expires!');
            console.log('⚠️  Store it with extreme care!');
            console.log('⚠️  Consider using time-limited tokens instead.');
          } catch (error) {
            console.error('Error:', error.message);
          }
        } else {
          console.log('\n❌ Operation cancelled.');
        }
        break;
        
      case '7':
        console.log('\n👋 Goodbye!\n');
        running = false;
        break;
        
      default:
        console.log('\n❌ Invalid option. Please try again.');
    }
    
    if (running && choice !== '7') {
      await askQuestion('\nPress Enter to continue...');
    }
  }
  
  rl.close();
}

// Check if dist folder exists
const fs = require('fs');
const path = require('path');
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist folder not found!');
  console.log('Please run "npm run build" first to compile the TypeScript files.\n');
  process.exit(1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});