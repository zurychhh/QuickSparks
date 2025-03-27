const express = require('express');
//const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.QR_SERVICE_PORT || 3003;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());

// Routes
app.get('/status', (req, res) => {
  res.json({ status: 'online', service: 'qr-service' });
});

app.post('/generate', async (req, res) => {
  try {
    const { text, size, dark, light } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // QR Code options
    const options = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: dark || '#000000',
        light: light || '#ffffff'
      },
      width: parseInt(size) || 300
    };

    // Generate QR code
    const fileName = `qrcode-${Date.now()}.png`;
    const filePath = path.join(uploadsDir, fileName);

    // Two approaches - either save to file or return as data URL
    await QRCode.toFile(filePath, text, options);

    // Also generate as base64 for embedding directly in response
    const qrDataUrl = await QRCode.toDataURL(text, options);

    // In a real app, you'd store this file somewhere permanent
    // and potentially use a CDN or object storage
    const fileUrl = `/qr-service/downloads/${fileName}`;

    res.json({
      url: fileUrl,
      qr: qrDataUrl,
      fileName,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Serve generated QR codes
app.use('/downloads', express.static(uploadsDir));

// Start server
app.listen(PORT, () => {
  console.log(`QR code service running on port ${PORT}`);
});
