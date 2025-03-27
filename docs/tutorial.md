# Conversion Microservices Tutorial

This tutorial will guide you through using the Conversion Microservices API to convert files between different formats.

## Prerequisites

- cURL or Postman
- A modern web browser
- Basic understanding of REST APIs

## Getting Started

First, make sure all services are running:

```bash
cd conversion-microservices
npm run dev
```

In separate terminals, start each service:

```bash
npm run pdf-service    # Port 3001
npm run image-service  # Port 3002
npm run qr-service     # Port 3003
```

You can also use Docker Compose to run everything:

```bash
docker-compose up
```

## Using the Web Interface

Navigate to http://localhost:3000 in your web browser to access the web interface.

## Using the API

### 1. PDF Generation

Convert text to a PDF document:

```bash
curl -X POST http://localhost:3000/api/pdf/convert \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test PDF document."}'
```

### 2. Image Processing

Convert and resize an image:

```bash
curl -X POST http://localhost:3000/api/image/convert \
  -F "image=@/path/to/your/image.jpg" \
  -F "width=800" \
  -F "format=webp"
```

### 3. QR Code Generation

Generate a QR code:

```bash
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "https://example.com", "size": 300}'
```

## Examples

### Example 1: Create a PDF from Text

```javascript
fetch('http://localhost:3000/api/pdf/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'This is a sample PDF document created with our API.'
  }),
})
.then(response => response.json())
.then(data => {
  console.log('PDF URL:', data.url);
  window.open(data.url);
})
.catch(error => console.error('Error:', error));
```

### Example 2: Generate a QR Code for a Website

```javascript
fetch('http://localhost:3000/api/qr/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'https://example.com',
    size: 300,
    dark: '#000000',
    light: '#ffffff'
  }),
})
.then(response => response.json())
.then(data => {
  const img = document.createElement('img');
  img.src = data.qr;
  document.body.appendChild(img);
})
.catch(error => console.error('Error:', error));
```

### Example 3: Convert an Image to WebP Format

```html
<form id="imageForm">
  <input type="file" id="imageFile" accept="image/*">
  <input type="number" id="width" value="800">
  <button type="submit">Convert</button>
</form>

<script>
  document.getElementById('imageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('image', document.getElementById('imageFile').files[0]);
    formData.append('width', document.getElementById('width').value);
    formData.append('format', 'webp');
    
    try {
      const response = await fetch('http://localhost:3000/api/image/convert', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Converted image URL:', data.url);
      window.open(data.url);
    } catch (error) {
      console.error('Error:', error);
    }
  });
</script>
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Description of what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters or invalid input)
- 500: Server error
- 503: Service unavailable