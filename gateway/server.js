const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Service endpoints
app.use('/api/pdf', require('./routes/pdf-routes'));
app.use('/api/image', require('./routes/image-routes'));
app.use('/api/qr', require('./routes/qr-routes'));
app.use('/api/auth', require('./routes/auth-routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
  console.log('Available services:');
  console.log('- PDF Service: http://localhost:3001');
  console.log('- Image Service: http://localhost:3002');
  console.log('- QR Service: http://localhost:3003');
  console.log('- Auth Service: http://localhost:3004');
});