FROM node:20-slim AS builder

# Install dependencies for PDF processing
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-dejavu \
    fontconfig && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create production image
FROM node:20-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    fonts-dejavu \
    fontconfig && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./.env

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs

# Run as non-root user for better security
USER node

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application
CMD ["node", "dist/index.js"]