#!/usr/bin/env node

/**
 * Create Microservice Script
 * 
 * This script automates the creation of a new microservice with proper boilerplate.
 * 
 * Usage:
 * node scripts/create-microservice.js --name my-service [--type express|nest] [--port 3001]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Parse command line arguments
const args = process.argv.slice(2);
let serviceName = '';
let serviceType = 'express'; // Default type
let servicePort = '3000'; // Default port

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    serviceName = args[i + 1];
    i++;
  } else if (args[i] === '--type' && args[i + 1]) {
    serviceType = args[i + 1];
    i++;
  } else if (args[i] === '--port' && args[i + 1]) {
    servicePort = args[i + 1];
    i++;
  }
}

// Validate arguments
if (!serviceName) {
  console.error('Error: Service name is required (--name my-service)');
  process.exit(1);
}

if (!['express', 'nest'].includes(serviceType)) {
  console.error('Error: Service type must be "express" or "nest"');
  process.exit(1);
}

// Confirm service creation
console.log(`Creating new ${serviceType} microservice: ${serviceName}`);
console.log(`Service will run on port: ${servicePort}`);

rl.question('Continue? (y/n) ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation cancelled');
    rl.close();
    process.exit(0);
  }

  rl.close();
  createService();
});

function createService() {
  const serviceDir = path.join(process.cwd(), 'services', serviceName);

  // Check if service already exists
  if (fs.existsSync(serviceDir)) {
    console.error(`Error: Service '${serviceName}' already exists at ${serviceDir}`);
    process.exit(1);
  }

  // Create service directory
  fs.mkdirSync(serviceDir, { recursive: true });

  // Create service files based on type
  if (serviceType === 'express') {
    createExpressService(serviceDir, serviceName, servicePort);
  } else if (serviceType === 'nest') {
    createNestService(serviceDir, serviceName, servicePort);
  }

  // Install dependencies
  console.log('Installing dependencies...');
  execSync('pnpm install', { cwd: serviceDir, stdio: 'inherit' });

  console.log(`\n✅ Service '${serviceName}' created successfully at ${serviceDir}`);
  console.log(`\nTo start the service:\ncd ${serviceDir}\npnpm dev`);
}

function createExpressService(serviceDir, serviceName, servicePort) {
  // Create package.json
  const packageJson = {
    name: `@conversion-microservices/${serviceName}`,
    version: '1.0.0',
    description: `${formatName(serviceName)} microservice`,
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      dev: 'nodemon src/index.js',
      test: 'jest',
      lint: 'eslint .',
    },
    dependencies: {
      express: '^4.18.3',
      'body-parser': '^1.20.2',
      cors: '^2.8.5',
      helmet: '^7.1.0',
      morgan: '^1.10.0',
    },
    devDependencies: {
      eslint: '^8.56.0',
      jest: '^29.7.0',
      nodemon: '^3.0.3',
      supertest: '^6.3.4',
    },
  };

  fs.writeFileSync(
    path.join(serviceDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create Dockerfile
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE ${servicePort}

CMD ["npm", "start"]
`;

  fs.writeFileSync(path.join(serviceDir, 'Dockerfile'), dockerfile);

  // Create source directory
  const srcDir = path.join(serviceDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'routes'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'controllers'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'services'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'middleware'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'utils'), { recursive: true });

  // Create index.js
  const indexJs = `/**
 * ${formatName(serviceName)} Microservice
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const mainRoutes = require('./routes/index');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Routes
app.use('/', mainRoutes);

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: '${serviceName}',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Start server
const PORT = process.env.PORT || ${servicePort};
app.listen(PORT, () => {
  console.log(\`${formatName(serviceName)} service running on port \${PORT}\`);
});

module.exports = app; // For testing
`;

  fs.writeFileSync(path.join(srcDir, 'index.js'), indexJs);

  // Create routes/index.js
  const routesIndexJs = `/**
 * Main routes for ${formatName(serviceName)} service
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/main.controller');

/**
 * @route GET /
 * @description Service information
 */
router.get('/', controller.getInfo);

// Add your routes here

module.exports = router;
`;

  fs.writeFileSync(path.join(srcDir, 'routes', 'index.js'), routesIndexJs);

  // Create controllers/main.controller.js
  const controllerJs = `/**
 * Main controller for ${formatName(serviceName)} service
 */

/**
 * Get service information
 */
exports.getInfo = (req, res) => {
  res.json({
    service: '${formatName(serviceName)} Microservice',
    version: '1.0.0',
    endpoints: [
      {
        path: '/',
        method: 'GET',
        description: 'Service information',
      },
      {
        path: '/status',
        method: 'GET',
        description: 'Health check endpoint',
      },
      // Add your endpoints here
    ],
  });
};
`;

  fs.writeFileSync(
    path.join(srcDir, 'controllers', 'main.controller.js'),
    controllerJs
  );

  // Create a sample service file
  const serviceJs = `/**
 * Main service for ${formatName(serviceName)}
 */

class ${formatName(serviceName, true)}Service {
  constructor() {
    // Initialize service
  }

  // Add your service methods here
}

module.exports = new ${formatName(serviceName, true)}Service();
`;

  fs.writeFileSync(
    path.join(srcDir, 'services', `${serviceName}.service.js`),
    serviceJs
  );

  // Create tests directory
  const testsDir = path.join(serviceDir, 'tests');
  fs.mkdirSync(testsDir, { recursive: true });

  // Create .eslintrc.js
  const eslintrcJs = `module.exports = {
  extends: '../../.eslintrc.js',
  // Service-specific ESLint settings
};
`;

  fs.writeFileSync(path.join(serviceDir, '.eslintrc.js'), eslintrcJs);

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules

# Logs
logs
*.log
npm-debug.log*

# Environment
.env
.env.local

# Coverage directory
coverage

# Temp files
tmp
temp
`;

  fs.writeFileSync(path.join(serviceDir, '.gitignore'), gitignore);

  // Create basic test file
  const testJs = `const request = require('supertest');
const app = require('../src/index');

describe('${formatName(serviceName)} Service', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/status');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('online');
    expect(response.body.service).toBe('${serviceName}');
  });

  it('should provide service information', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.service).toBe('${formatName(serviceName)} Microservice');
  });
});
`;

  fs.writeFileSync(path.join(testsDir, 'service.test.js'), testJs);

  // Create README.md
  const readme = `# ${formatName(serviceName)} Microservice

Part of the QuickSparks Conversion Microservices platform.

## Description

${formatName(serviceName)} service for handling [describe functionality].

## Installation

\`\`\`bash
pnpm install
\`\`\`

## Running the service

\`\`\`bash
# Development
pnpm dev

# Production
pnpm start
\`\`\`

## API Endpoints

- \`GET /\`: Service information
- \`GET /status\`: Health check

## Testing

\`\`\`bash
pnpm test
\`\`\`

## Docker

\`\`\`bash
# Build
docker build -t quicksparks/${serviceName} .

# Run
docker run -p ${servicePort}:${servicePort} quicksparks/${serviceName}
\`\`\`
`;

  fs.writeFileSync(path.join(serviceDir, 'README.md'), readme);

  console.log(`Created Express microservice: ${serviceName}`);
}

function createNestService(serviceDir, serviceName, servicePort) {
  console.log('Creating NestJS microservice...');

  // Generate NestJS project with CLI
  try {
    execSync(`npx --yes @nestjs/cli new ${serviceName} --package-manager pnpm --skip-git`, { 
      cwd: path.dirname(serviceDir),
      stdio: 'inherit',
    });

    // Modify package.json
    const packageJsonPath = path.join(serviceDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.name = `@conversion-microservices/${serviceName}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Update main.ts port
    const mainTsPath = path.join(serviceDir, 'src', 'main.ts');
    let mainTs = fs.readFileSync(mainTsPath, 'utf8');
    mainTs = mainTs.replace(
      'await app.listen(3000)',
      `await app.listen(${servicePort})`
    );
    fs.writeFileSync(mainTsPath, mainTs);

    // Create Dockerfile
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run build

EXPOSE ${servicePort}

CMD ["npm", "run", "start:prod"]
`;

    fs.writeFileSync(path.join(serviceDir, 'Dockerfile'), dockerfile);

    // Update README
    const readmePath = path.join(serviceDir, 'README.md');
    const readme = `# ${formatName(serviceName)} Microservice

Part of the QuickSparks Conversion Microservices platform.

## Description

${formatName(serviceName)} service for handling [describe functionality].

## Installation

\`\`\`bash
pnpm install
\`\`\`

## Running the service

\`\`\`bash
# Development
pnpm run start:dev

# Production
pnpm run start:prod
\`\`\`

## API Endpoints

- \`GET /\`: Service information
- \`GET /health\`: Health check

## Testing

\`\`\`bash
# Unit tests
pnpm run test

# Integration tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
\`\`\`

## Docker

\`\`\`bash
# Build
docker build -t quicksparks/${serviceName} .

# Run
docker run -p ${servicePort}:${servicePort} quicksparks/${serviceName}
\`\`\`
`;

    fs.writeFileSync(readmePath, readme);

    console.log(`Created NestJS microservice: ${serviceName}`);
  } catch (error) {
    console.error('Error creating NestJS microservice:', error.message);
    // Clean up if something went wrong
    try {
      fs.rmSync(serviceDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError.message);
    }
    process.exit(1);
  }
}

// Helper function to format service name
function formatName(name, pascalCase = false) {
  // Convert kebab-case to readable format
  const formatted = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  if (pascalCase) {
    return formatted.replace(/\s+/g, '');
  }
  
  return formatted;
}