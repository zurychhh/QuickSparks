# Setting Up the Conversion Microservices Project

This guide will help you set up the Conversion Microservices project from scratch.

## Prerequisites

- Node.js v14 or later
- npm v6 or later
- Docker and Docker Compose (optional, for containerized deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd conversion-microservices
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Services Locally

Start all services using PM2:

```bash
# Install PM2 globally if you haven't already
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js
```

Or start individual services in separate terminals:

```bash
# Terminal 1: Start the gateway
npm run dev

# Terminal 2: Start the PDF service
npm run pdf-service

# Terminal 3: Start the image service
npm run image-service

# Terminal 4: Start the QR service
npm run qr-service
```

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Docker Setup (Recommended for Production)

### 1. Build and Start with Docker Compose

```bash
docker-compose up -d
```

This will build the Docker images and start all services in detached mode.

### 2. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Testing

Run the test suite:

```bash
npm test
```

For code linting:

```bash
npm run lint
```

## Directory Structure

```
conversion-microservices/
├── gateway/              # API Gateway
│   ├── public/           # Static frontend files
│   ├── routes/           # Route definitions
│   └── server.js         # Gateway server
├── services/             # Microservices
│   ├── pdf-service/      # PDF generation service
│   ├── image-service/    # Image processing service
│   └── qr-service/       # QR code generation service
├── shared/               # Shared utilities
├── docs/                 # Documentation
├── tests/                # Test files
└── docker-compose.yml    # Docker Compose configuration
```

## Configuration

Each service can be configured using environment variables:

```
PORT=3000                 # Gateway port
PDF_SERVICE_PORT=3001     # PDF service port
IMAGE_SERVICE_PORT=3002   # Image service port
QR_SERVICE_PORT=3003      # QR service port
```

You can set these in a `.env` file at the root of the project.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000-3003 are available. If not, you can change them using environment variables.

2. **Missing dependencies**: If you encounter missing module errors, try running `npm install` again.

3. **File permissions**: Ensure the application has write permissions to create the upload directories.

4. **Docker network issues**: If services can't communicate when using Docker, check the Docker network configuration.

### Logs

View logs for all services:

```bash
# If using PM2
pm2 logs

# If using Docker
docker-compose logs -f
```