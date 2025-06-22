#!/usr/bin/env node

/**
 * Frontend Deployment Script
 * This script builds and prepares the frontend for deployment to a dev or prod environment
 * 
 * Usage:
 * - npm run deploy [environment]
 *   where environment is 'dev' (default) or 'prod'
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get environment from command line argument or default to 'dev'
const environment = process.argv[2] || 'dev';
const validEnvironments = ['dev', 'prod'];

if (!validEnvironments.includes(environment)) {
  console.error(`Invalid environment: ${environment}. Valid options are: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

const buildScript = environment === 'prod' ? 'deploy:prod' : 'deploy:dev';
const distDir = path.join(__dirname, '../dist');

console.log(`🚀 Deploying frontend for ${environment} environment`);

try {
  // Step 1: Run linter
  console.log('Running linter checks...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting completed successfully');

  // Step 2: Build the application
  console.log(`Building application for ${environment}...`);
  execSync(`npm run ${buildScript}`, { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Step 3: Verify build output
  if (fs.existsSync(distDir)) {
    console.log(`Build output directory exists: ${distDir}`);
    const files = fs.readdirSync(distDir);
    console.log(`Files in build directory: ${files.length}`);
  } else {
    throw new Error(`Build directory not found: ${distDir}`);
  }
  // Step 4: Copy environment-specific configuration
  const envConfig = {
    dev: 'development',
    prod: 'production'
  }[environment];
  
  console.log(`Preparing ${envConfig} environment configuration...`);
  
  // Create a deployment info file
  const buildTime = new Date().toISOString();
  const version = require('../package.json').version;
  
  const deploymentInfo = {
    environment,
    buildTime,
    version
  };
  
  fs.writeFileSync(
    path.join(distDir, 'deployment-info.json'), 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Step 5: Update health check endpoint
  console.log('Updating health check endpoint...');
  const healthCheckPath = path.join(distDir, 'health.json');
  
  if (fs.existsSync(healthCheckPath)) {
    let healthContent = fs.readFileSync(healthCheckPath, 'utf8');
    healthContent = healthContent
      .replace('%VITE_CLIENT_VERSION%', version)
      .replace('%VITE_NODE_ENV%', envConfig)
      .replace('%BUILD_DATE%', buildTime);
    
    fs.writeFileSync(healthCheckPath, healthContent);
    console.log('✅ Health check endpoint updated');
  } else {
    console.log('⚠️ Health check file not found, creating it...');
    const healthContent = JSON.stringify({
      status: 'ok',
      version,
      environment: envConfig,
      buildDate: buildTime
    }, null, 2);
    
    fs.writeFileSync(healthCheckPath, healthContent);
    console.log('✅ Health check endpoint created');
  }
  console.log('✅ Deployment preparation completed');
  console.log(`\n🎉 Frontend successfully built for ${environment} environment!`);
  console.log(`The build is ready in the ${distDir} directory`);
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}
