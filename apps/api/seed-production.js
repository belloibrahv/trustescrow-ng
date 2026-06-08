#!/usr/bin/env node
/**
 * Production Database Seeding Script
 * Run this to seed admin users and essential data for production
 */

const { exec } = require('child_process');

console.log('🌱 Setting up production database...');
console.log('📅', new Date().toISOString());

// First, run Prisma migrations
console.log('🔄 Running database migrations...');
exec('npx prisma migrate deploy', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Migrations completed');
  
  // Then generate Prisma client
  console.log('🔄 Generating Prisma client...');
  exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Prisma generate failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Prisma client generated');
    
    // Finally, seed production data
    console.log('🌱 Seeding production data...');
    exec('npm run db:seed', (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
      }
      
      console.log('🎉 Production database setup complete!');
      console.log('');
      console.log('📋 Admin Credentials:');
      console.log('   Username: admin    | Password: TrustEscrow2024!     | Role: Super Admin');
      console.log('   Username: operator | Password: OpSecure2024!       | Role: Admin');
      console.log('   Username: support  | Password: SupportKey2024!     | Role: Admin');
      console.log('');
      console.log('🌐 Login at: https://trustescrow-ng-admin.vercel.app/login');
      console.log('🔗 API: https://trustescrow-ng.onrender.com');
    });
  });
});