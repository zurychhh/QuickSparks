FROM node:20-alpine

WORKDIR /app

# Install build dependencies for Sharp
RUN apk add --no-cache python3 make g++

# Copy package.json and install dependencies
COPY packages/image-service/package.json ./
RUN npm install

# Create uploads directory
RUN mkdir -p uploads

# Copy the rest of the application
COPY packages/image-service ./src

EXPOSE 3002

CMD ["node", "src/index.js"]