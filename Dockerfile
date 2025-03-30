FROM node:20-alpine as base

WORKDIR /app
COPY package*.json ./

FROM base as builder
RUN npm install
COPY . .

FROM base as gateway
RUN npm ci --production
COPY --from=builder /app/gateway /app/gateway
COPY --from=builder /app/shared /app/shared
CMD ["node", "gateway/server.js"]

FROM base as pdf-service
RUN npm ci --production
COPY --from=builder /app/services/pdf-service /app/services/pdf-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "services/pdf-service/index.js"]

FROM base as image-service
RUN npm ci --production
COPY --from=builder /app/services/image-service /app/services/image-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "services/image-service/index.js"]

FROM base as qr-service
RUN npm ci --production
COPY --from=builder /app/services/qr-service /app/services/qr-service
COPY --from=builder /app/shared /app/shared
CMD ["node", "services/qr-service/index.js"]