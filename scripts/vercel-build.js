#!/usr/bin/env node
/**
 * Vercel Build Script
 * 
 * This script runs before the build to ensure the correct Prisma schema is used:
 * - In Vercel/production: Uses schema.postgres.prisma (PostgreSQL)
 * - Locally: Uses schema.prisma (SQLite)
 * 
 * Vercel sets NODE_ENV=production and VERCEL=1 during builds
 */

const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1' || process.env.CI === 'true';
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const postgresSchemaPath = path.join(__dirname, '../prisma/schema.postgres.prisma');

console.log('🔧 Vercel Build Script');
console.log('Environment:', {
  VERCEL: process.env.VERCEL,
  CI: process.env.CI,
  NODE_ENV: process.env.NODE_ENV,
  isVercel
});

if (isVercel) {
  console.log('📦 Running in Vercel/CI environment');
  
  // Check if PostgreSQL schema exists
  if (!fs.existsSync(postgresSchemaPath)) {
    console.error('❌ Error: schema.postgres.prisma not found!');
    console.error('   Expected at:', postgresSchemaPath);
    process.exit(1);
  }

  // Backup current schema (SQLite)
  if (fs.existsSync(schemaPath)) {
    const backupPath = path.join(__dirname, '../prisma/schema.sqlite.prisma');
    console.log('📋 Backing up SQLite schema to:', backupPath);
    fs.copyFileSync(schemaPath, backupPath);
  }

  // Copy PostgreSQL schema to schema.prisma for the build
  console.log('🔄 Switching to PostgreSQL schema for build...');
  fs.copyFileSync(postgresSchemaPath, schemaPath);
  console.log('✅ PostgreSQL schema activated');
  
  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  Warning: DATABASE_URL not set in environment');
    console.warn('   Make sure to configure it in Vercel dashboard');
  } else {
    // Don't log the full URL for security
    const dbType = process.env.DATABASE_URL.startsWith('postgresql') ? 'PostgreSQL' : 'Unknown';
    console.log('✅ DATABASE_URL configured:', dbType);
  }
} else {
  console.log('💻 Running locally - using existing schema.prisma');
  console.log('   (No changes needed for local development)');
}

console.log('✅ Build preparation complete\n');
