#!/usr/bin/env node
/**
 * Generate Production Secrets
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('='.repeat(60));
console.log('TrustEscrow NG - Production Secrets Generator');
console.log('='.repeat(60));
console.log('');

// Generate secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const ninSalt = crypto.randomBytes(32).toString('hex');
const adminPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
const operatorPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

console.log('🔐 CRITICAL SECRETS - STORE SECURELY!');
console.log('');
console.log('# Admin JWT Secret (256-bit)');
console.log(`ADMIN_JWT_SECRET=${jwtSecret}`);
console.log('');
console.log('# Encryption Key (32 bytes for AES-256)');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');
console.log('# NIN Salt (for hashing)');
console.log(`NIN_SALT=${ninSalt}`);
console.log('');
console.log('# Admin Passwords (CHANGE AFTER FIRST LOGIN!)');
console.log(`Admin Password: ${adminPassword}`);
console.log(`Operator Password: ${operatorPassword}`);
console.log('');
console.log('# Admin Users JSON (copy this entire line)');
const adminUsers = JSON.stringify([
  { username: 'admin', password: adminPassword, role: 'super_admin' },
  { username: 'operator', password: operatorPassword, role: 'admin' }
]);
console.log(`ADMIN_USERS='${adminUsers}'`);
console.log('');
console.log('='.repeat(60));
console.log('⚠️  IMPORTANT:');
console.log('1. Copy these values to a secure password manager');
console.log('2. Set them in Railway environment variables');
console.log('3. Never commit these to git');
console.log('4. Change admin passwords after first login');
console.log('='.repeat(60));
console.log('');

// Generate Railway commands
console.log('📋 Railway CLI Commands (copy & paste):');
console.log('');
console.log(`railway variables set ADMIN_JWT_SECRET="${jwtSecret}"`);
console.log(`railway variables set ENCRYPTION_KEY="${encryptionKey}"`);
console.log(`railway variables set NIN_SALT="${ninSalt}"`);
console.log(`railway variables set ADMIN_USERS='${adminUsers}'`);
console.log('');
console.log('='.repeat(60));
