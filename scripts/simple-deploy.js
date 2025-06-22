#!/usr/bin/env node

/**
 * Simple Frontend Deployment Script
 * 
 * Usage:
 * - npm run deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

console.log('🚀 Building frontend for deployment');

try {
  // Step 1: Clean previous build
  console.log('Cleaning previous build...');
  if (fs.existsSync(distDir)) {
    execSync('npm run clean', { stdio: 'inherit' });
  }
  
  // Step 2: Build the application
  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Step 3: Verify build output
  if (fs.existsSync(distDir)) {
    console.log(`Build output directory exists: ${distDir}`);
    const files = fs.readdirSync(distDir);
    console.log(`Files in build directory: ${files.length}`);
  } else {
    throw new Error(`Build directory not found: ${distDir}`);
  }
  
  // Step 4: Create a simple health check file
  const buildTime = new Date().toISOString();
  const version = require('../package.json').version;
  
  const healthContent = JSON.stringify({
    status: 'ok',
    version,
    buildDate: buildTime
  }, null, 2);
  
  fs.writeFileSync(path.join(distDir, 'health.json'), healthContent);
  console.log('✅ Health check file created');
  
  console.log('\n🎉 Frontend successfully built!');
  console.log(`The build is ready in the ${distDir} directory`);
  console.log('\nTo deploy:');
  console.log('- Copy the contents of the dist directory to your web server');
  console.log('- Make sure your server redirects all requests to index.html');
  
} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
}
