FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY gateway/package.json ./
RUN npm install

# Copy the rest of the application
COPY gateway ./src

EXPOSE 3000

CMD ["node", "src/server.js"]