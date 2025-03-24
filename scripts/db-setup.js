#!/usr/bin/env node

/**
 * Database Setup and Migration Script
 * 
 * This script helps with setting up databases for different services
 * and running migrations.
 * 
 * Usage:
 * node scripts/db-setup.js --action [setup|migrate|seed] --service [service-name]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Parse command line arguments
const args = process.argv.slice(2);
let action = '';
let serviceName = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--action' && args[i + 1]) {
    action = args[i + 1];
    i++;
  } else if (args[i] === '--service' && args[i + 1]) {
    serviceName = args[i + 1];
    i++;
  }
}

// Validate arguments
if (!['setup', 'migrate', 'seed'].includes(action)) {
  console.error('Error: Action must be one of: setup, migrate, seed');
  console.log('Usage: node scripts/db-setup.js --action [setup|migrate|seed] --service [service-name]');
  process.exit(1);
}

if (!serviceName) {
  console.error('Error: Service name is required');
  console.log('Usage: node scripts/db-setup.js --action [setup|migrate|seed] --service [service-name]');
  process.exit(1);
}

// Confirm action
console.log(`Running '${action}' action for service '${serviceName}'`);

rl.question('Continue? (y/n) ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation cancelled');
    rl.close();
    process.exit(0);
  }

  rl.close();
  performDatabaseAction(action, serviceName);
});

function performDatabaseAction(action, serviceName) {
  // Determine service path
  let servicePath;
  if (fs.existsSync(path.join(process.cwd(), 'services', serviceName))) {
    servicePath = path.join(process.cwd(), 'services', serviceName);
  } else if (fs.existsSync(path.join(process.cwd(), 'packages', serviceName))) {
    servicePath = path.join(process.cwd(), 'packages', serviceName);
  } else if (serviceName === 'gateway' && fs.existsSync(path.join(process.cwd(), 'gateway'))) {
    servicePath = path.join(process.cwd(), 'gateway');
  } else {
    console.error(`Error: Service '${serviceName}' not found`);
    process.exit(1);
  }

  // Check if service has database configuration
  const dbConfigPath = path.join(servicePath, 'prisma', 'schema.prisma');
  const knexfilePath = path.join(servicePath, 'knexfile.js');
  const sequelizeConfigPath = path.join(servicePath, 'config', 'config.json');

  let dbType = 'unknown';
  
  if (fs.existsSync(dbConfigPath)) {
    dbType = 'prisma';
  } else if (fs.existsSync(knexfilePath)) {
    dbType = 'knex';
  } else if (fs.existsSync(sequelizeConfigPath)) {
    dbType = 'sequelize';
  }

  if (dbType === 'unknown') {
    console.error(`Error: No database configuration found for service '${serviceName}'`);
    console.log('Ensure the service has one of: prisma/schema.prisma, knexfile.js, or config/config.json');
    process.exit(1);
  }

  console.log(`Using ${dbType} for database operations`);

  try {
    switch (action) {
      case 'setup':
        setupDatabase(dbType, servicePath);
        break;
      case 'migrate':
        runMigrations(dbType, servicePath);
        break;
      case 'seed':
        seedDatabase(dbType, servicePath);
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function setupDatabase(dbType, servicePath) {
  console.log('Setting up database...');
  
  switch (dbType) {
    case 'prisma':
      // Generate Prisma client
      execSync('npx prisma generate', { cwd: servicePath, stdio: 'inherit' });
      
      // Create database if it doesn't exist
      try {
        execSync('npx prisma db push', { cwd: servicePath, stdio: 'inherit' });
      } catch (error) {
        console.error('Error creating database schema. You may need to create the database first.');
        throw error;
      }
      break;
      
    case 'knex':
      // Create database tables
      execSync('npx knex migrate:latest', { cwd: servicePath, stdio: 'inherit' });
      break;
      
    case 'sequelize':
      // Create database
      execSync('npx sequelize-cli db:create', { cwd: servicePath, stdio: 'inherit' });
      
      // Run migrations
      execSync('npx sequelize-cli db:migrate', { cwd: servicePath, stdio: 'inherit' });
      break;
  }
  
  console.log('Database setup completed successfully!');
}

function runMigrations(dbType, servicePath) {
  console.log('Running migrations...');
  
  switch (dbType) {
    case 'prisma':
      // Run Prisma migrations
      execSync('npx prisma migrate dev', { cwd: servicePath, stdio: 'inherit' });
      break;
      
    case 'knex':
      // Run Knex migrations
      execSync('npx knex migrate:latest', { cwd: servicePath, stdio: 'inherit' });
      break;
      
    case 'sequelize':
      // Run Sequelize migrations
      execSync('npx sequelize-cli db:migrate', { cwd: servicePath, stdio: 'inherit' });
      break;
  }
  
  console.log('Migrations completed successfully!');
}

function seedDatabase(dbType, servicePath) {
  console.log('Seeding database...');
  
  switch (dbType) {
    case 'prisma':
      // Check if seed script exists in package.json
      const packageJsonPath = path.join(servicePath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.scripts && packageJson.scripts.seed) {
          execSync('npm run seed', { cwd: servicePath, stdio: 'inherit' });
        } else {
          console.log('No seed script found in package.json. Looking for prisma/seed.js...');
          
          // Look for seed.js file
          const seedPath = path.join(servicePath, 'prisma', 'seed.js');
          if (fs.existsSync(seedPath)) {
            execSync(`node ${seedPath}`, { cwd: servicePath, stdio: 'inherit' });
          } else {
            throw new Error('No seed script or prisma/seed.js file found');
          }
        }
      }
      break;
      
    case 'knex':
      // Run Knex seeds
      execSync('npx knex seed:run', { cwd: servicePath, stdio: 'inherit' });
      break;
      
    case 'sequelize':
      // Run Sequelize seeds
      execSync('npx sequelize-cli db:seed:all', { cwd: servicePath, stdio: 'inherit' });
      break;
  }
  
  console.log('Database seeding completed successfully!');
}