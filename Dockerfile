FROM node:20-alpine as base

WORKDIR /app
COPY package*.json ./

FROM base as builder
RUN npm install
COPY . .

FROM base as gateway
RUN npm install --production
COPY --from=builder /app/gateway /app/gateway
COPY --from=builder /app/shared /app/shared
CMD ["node", "gateway/server.js"]

FROM base as pdf-service
WORKDIR /app/services/pdf-service
COPY services/pdf-service/package*.json ./
RUN npm install --production
COPY --from=builder /app/services/pdf-service /app/services/pdf-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "index.js"]

FROM base as image-service
WORKDIR /app/services/image-service
COPY services/image-service/package*.json ./
RUN npm install --production
COPY --from=builder /app/services/image-service /app/services/image-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "index.js"]

FROM base as qr-service
WORKDIR /app/services/qr-service
COPY services/qr-service/package*.json ./
RUN npm install --production
COPY --from=builder /app/services/qr-service /app/services/qr-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "index.js"]