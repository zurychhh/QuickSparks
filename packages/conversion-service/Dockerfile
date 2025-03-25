FROM node:20-slim AS builder

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