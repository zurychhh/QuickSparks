module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './gateway/server.js',
      watch: ['gateway'],
      env: {
        PORT: 3000
      }
    },
    {
      name: 'pdf-service',
      script: './services/pdf-service/index.js',
      watch: ['services/pdf-service'],
      env: {
        PDF_SERVICE_PORT: 3001
      }
    },
    {
      name: 'image-service',
      script: './services/image-service/index.js',
      watch: ['services/image-service'],
      env: {
        IMAGE_SERVICE_PORT: 3002
      }
    },
    {
      name: 'qr-service',
      script: './services/qr-service/index.js',
      watch: ['services/qr-service'],
      env: {
        QR_SERVICE_PORT: 3003
      }
    }
  ]
};