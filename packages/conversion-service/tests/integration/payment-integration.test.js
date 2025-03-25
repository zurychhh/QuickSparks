const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Mock models
const Payment = require('../../src/models/payment.model').default;
const Conversion = require('../../src/models/conversion.model').default;

// Mock services
jest.mock('axios');
jest.mock('../../src/services/notificationService', () => ({
  sendPaymentStatusNotification: jest.fn(),
  sendConversionStatusNotification: jest.fn(),
  addConversionJob: jest.fn()
}));

describe('Payment Integration Tests', () => {
  // Setup mocks and test data
  let mockConversion;
  let mockUser;
  let mockPayment;
  
  beforeAll(async () => {
    // Create mock data
    mockUser = {
      id: '60a1e2c9c7d1b84b0a1e1e9f'
    };
    
    mockConversion = {
      _id: mongoose.Types.ObjectId(),
      userId: mockUser.id,
      conversionType: 'pdf-to-docx',
      status: 'completed',
      pageCount: 10
    };
    
    mockPayment = {
      _id: mongoose.Types.ObjectId(),
      conversionId: mockConversion._id,
      userId: mockUser.id,
      amount: 4.99,
      currency: 'PLN',
      status: 'pending',
      provider: 'paybylink',
      paymentId: uuidv4(),
      paymentUrl: 'https://paybylink.pl/payment/12345',
      successUrl: 'http://localhost:5001/payment/success',
      cancelUrl: 'http://localhost:5001/payment/cancel'
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Payment Creation', () => {
    test('should create a payment for a completed conversion', async () => {
      // Mock Conversion.findById
      Conversion.findById = jest.fn().mockResolvedValue(mockConversion);
      
      // Mock Payment.findOne to return null (no existing payment)
      Payment.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock Payment.create
      Payment.create = jest.fn().mockResolvedValue(mockPayment);
      
      // Mock Conversion.findByIdAndUpdate
      Conversion.findByIdAndUpdate = jest.fn().mockResolvedValue(mockConversion);
      
      // Mock axios.post for PayByLink API call
      axios.post.mockResolvedValue({
        data: {
          success: true,
          transactionId: '987654321',
          link: 'https://paybylink.pl/payment/12345'
        }
      });
      
      // Mock the request and response objects
      const req = {
        params: { conversionId: mockConversion._id.toString() },
        user: mockUser,
        body: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Import the controller after mocking
      const paymentController = require('../../src/controllers/paymentController');
      
      // Call the controller method
      await paymentController.initiatePayment(req, res);
      
      // Assert the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paymentId: expect.any(String),
            paymentUrl: expect.any(String)
          })
        })
      );
      
      // Verify Conversion.findById was called correctly
      expect(Conversion.findById).toHaveBeenCalledWith(mockConversion._id.toString());
      
      // Verify Payment.findOne was called correctly
      expect(Payment.findOne).toHaveBeenCalledWith({
        conversionId: mockConversion._id.toString(),
        userId: mockUser.id
      });
      
      // Verify Payment.create was called
      expect(Payment.create).toHaveBeenCalled();
      
      // Verify Conversion.findByIdAndUpdate was called to update with paymentId
      expect(Conversion.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConversion._id.toString(),
        { paymentId: expect.any(Object) }
      );
    });
    
    test('should return existing payment if already created', async () => {
      // Mock Conversion.findById
      Conversion.findById = jest.fn().mockResolvedValue(mockConversion);
      
      // Mock Payment.findOne to return an existing payment
      Payment.findOne = jest.fn().mockResolvedValue(mockPayment);
      
      // Mock the request and response objects
      const req = {
        params: { conversionId: mockConversion._id.toString() },
        user: mockUser,
        body: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Import the controller after mocking
      const paymentController = require('../../src/controllers/paymentController');
      
      // Call the controller method
      await paymentController.initiatePayment(req, res);
      
      // Assert the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment already initiated'
        })
      );
      
      // Verify Conversion.findById was called correctly
      expect(Conversion.findById).toHaveBeenCalledWith(mockConversion._id.toString());
      
      // Verify Payment.findOne was called correctly
      expect(Payment.findOne).toHaveBeenCalledWith({
        conversionId: mockConversion._id.toString(),
        userId: mockUser.id
      });
    });
  });
  
  describe('Payment Notification', () => {
    test('should process a payment notification correctly', async () => {
      // Setup mock data for notification
      const notificationData = {
        control: mockPayment.paymentId,
        transactionId: '987654321',
        status: 'SUCCESS',
        amount: '4.99',
        currency: 'PLN'
      };
      
      // Create signature
      const signature = crypto
        .createHmac('sha256', 'development-payment-secret')
        .update(
          Object.keys(notificationData)
            .sort()
            .map(key => `${key}=${notificationData[key]}`)
            .join('&')
        )
        .digest('hex');
      
      // Mock Payment.findOne
      Payment.findOne = jest.fn().mockResolvedValue(mockPayment);
      
      // Mock Payment.findByIdAndUpdate
      Payment.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: notificationData.transactionId
      });
      
      // Mock the request and response objects
      const req = {
        body: notificationData,
        headers: {
          'x-signature': signature
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Import the controller after mocking
      const paymentController = require('../../src/controllers/paymentController');
      
      // Call the controller method
      await paymentController.handlePaymentNotification(req, res);
      
      // Assert the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      
      // Verify Payment.findOne was called correctly
      expect(Payment.findOne).toHaveBeenCalledWith({ paymentId: notificationData.control });
      
      // Verify Payment.findByIdAndUpdate was called to update status
      expect(Payment.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
  
  describe('Payment Verification', () => {
    test('should verify a payment correctly', async () => {
      // Mock Payment.findOne
      Payment.findOne = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'completed'
      });
      
      // Mock the request and response objects
      const req = {
        params: { conversionId: mockConversion._id.toString() },
        headers: {
          'user-id': mockUser.id,
          'authorization': 'Bearer development-internal-api-key'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Import the controller after mocking
      const paymentController = require('../../src/controllers/paymentController');
      
      // Call the controller method
      await paymentController.verifyPaymentInternal(req, res);
      
      // Assert the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isPaid: true
          })
        })
      );
    });
  });
});