const request = require('supertest');
const express = require('express');
const { PDFDocument } = require('pdf-lib');

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Import after mocking dependencies
const app = express();
app.use(express.json());
app.use(require('../services/pdf-service/index.js')._router);

describe('PDF Service', () => {
  test('GET /status returns online status', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'online',
      service: 'pdf-service'
    });
  });

  test('POST /convert requires text parameter', async () => {
    const response = await request(app)
      .post('/convert')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});