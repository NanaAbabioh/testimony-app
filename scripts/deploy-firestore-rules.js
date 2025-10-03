#!/usr/bin/env node

/**
 * Script to deploy Firestore security rules and indexes
 * 
 * Usage:
 *   node scripts/deploy-firestore-rules.js
 * 
 * Prerequisites:
 *   - Firebase CLI installed: npm install -g firebase-tools
 *   - Firebase project initialized: firebase init firestore
 *   - User authenticated: firebase login
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RULES_FILE = path.join(PROJECT_ROOT, 'firestore.rules');
const INDEXES_FILE = path.join(PROJECT_ROOT, 'firestore.indexes.json');

console.log('🔥 Deploying Firestore Security Rules and Indexes\n');

// Check if files exist
if (!fs.existsSync(RULES_FILE)) {
  console.error('❌ firestore.rules file not found');
  process.exit(1);
}

if (!fs.existsSync(INDEXES_FILE)) {
  console.error('❌ firestore.indexes.json file not found');
  process.exit(1);
}

try {
  // Check if Firebase CLI is installed
  console.log('📋 Checking Firebase CLI...');
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI found\n');

  // Deploy security rules
  console.log('🛡️  Deploying security rules...');
  execSync('firebase deploy --only firestore:rules', { 
    stdio: 'inherit',
    cwd: PROJECT_ROOT 
  });
  console.log('✅ Security rules deployed\n');

  // Deploy indexes
  console.log('📊 Deploying indexes...');
  execSync('firebase deploy --only firestore:indexes', { 
    stdio: 'inherit',
    cwd: PROJECT_ROOT 
  });
  console.log('✅ Indexes deployed\n');

  console.log('🎉 All Firestore configurations deployed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Test the security rules in the Firebase console');
  console.log('2. Monitor index build progress in the Firebase console');
  console.log('3. Update any existing client code to use the new userSaves structure');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  if (error.message.includes('not logged in')) {
    console.log('\n💡 Please run: firebase login');
  }
  
  if (error.message.includes('No project')) {
    console.log('\n💡 Please run: firebase use --add');
  }
  
  process.exit(1);
}