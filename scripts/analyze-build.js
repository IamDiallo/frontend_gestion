#!/usr/bin/env node

/**
 * This is a utility script to analyze and optimize your frontend build
 * 
 * Usage:
 * - Run with: npm run analyze
 * - Optionally specify mode: npm run analyze prod
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const buildDir = path.join(__dirname, '../dist');
const jsDir = path.join(buildDir, 'assets');
const mode = process.argv[2] || 'dev';

console.log(`Building application in ${mode} mode for analysis...`);

try {
  // Clean previous builds
  console.log('Cleaning previous builds...');
  if (fs.existsSync(buildDir)) {
    execSync('npm run clean', { stdio: 'inherit' });
  }

  // Build the application with source maps enabled
  console.log(`Running build:${mode === 'prod' ? 'prod' : 'dev'} with sourcemaps...`);
  execSync(`npm run build:${mode === 'prod' ? 'prod' : 'dev'}`, { stdio: 'inherit' });

  // Run source-map-explorer on the build outputs
  console.log('Analyzing bundle size...');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(jsDir, file));
    
    if (jsFiles.length > 0) {
      const filesToAnalyze = jsFiles.join(' ');
      execSync(`npx source-map-explorer ${filesToAnalyze}`, { stdio: 'inherit' });
    } else {
      console.log('No JavaScript files found in the build output.');
    }
  } else {
    console.log(`JavaScript directory not found: ${jsDir}`);
  }
} catch (error) {
  console.error('Build analysis failed:', error.message);
  process.exit(1);
}
