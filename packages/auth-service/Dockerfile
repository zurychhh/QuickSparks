FROM node:20-alpine as builder

WORKDIR /app

# Copy root package.json and pnpm files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Copy the package.json file for this service
COPY packages/auth-service/package.json ./packages/auth-service/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application
COPY packages/auth-service ./packages/auth-service/

# Build the application
WORKDIR /app/packages/auth-service
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and node_modules
COPY --from=builder /app/packages/auth-service/dist ./dist
COPY --from=builder /app/packages/auth-service/node_modules ./node_modules
COPY --from=builder /app/packages/auth-service/package.json ./

# Expose port
EXPOSE 3004

# Start the service
CMD ["node", "dist/main.js"]