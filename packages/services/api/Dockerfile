FROM node:20-alpine as base

# Install dependencies for PDF processing
RUN apk add --no-cache \
    g++ \
    make \
    python3 \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base as builder
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base as production
RUN npm ci --production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start the app
CMD ["node", "dist/index.js"]