FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY packages/pdf-service/package.json ./
RUN npm install

# Create uploads directory
RUN mkdir -p uploads

# Copy the rest of the application
COPY packages/pdf-service ./src

EXPOSE 3001

CMD ["node", "src/index.js"]