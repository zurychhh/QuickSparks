import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ConversionPage from '../src/pages/Conversion';
import { FeedbackProvider } from '../src/context/FeedbackContext';
import * as apiService from '../src/services/api';

// Mock the API service
vi.mock('../src/services/api', () => ({
  uploadFile: vi.fn(),
  createCancelToken: vi.fn(() => ({
    token: 'mock-token',
    cancel: vi.fn(),
  })),
  getConversionStatus: vi.fn(),
  getDownloadToken: vi.fn(),
}));

// Mock the sentry utility
vi.mock('../src/utils/sentry', () => ({
  captureException: vi.fn(),
}));

// Helper function to create a test file
const createTestFile = (name = 'test.pdf', type = 'application/pdf', size = 1024) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('ConversionPage Component', () => {
  // Setup to wrap component with necessary providers
  const renderConversionPage = () => {
    return render(
      <BrowserRouter>
        <FeedbackProvider>
          <ConversionPage />
        </FeedbackProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders conversion type selector correctly', () => {
    renderConversionPage();
    
    // Check if conversion type selector is rendered
    expect(screen.getByText('Document Conversion Type')).toBeInTheDocument();
    expect(screen.getByText('Convert PDF to Word Document (DOCX)')).toBeInTheDocument();
  });

  test('allows changing conversion type', () => {
    renderConversionPage();
    
    // Get the select element and change its value
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'docx-to-pdf' } });
    
    // Check if the badge text updates
    expect(screen.getByText('DOCX → PDF')).toBeInTheDocument();
  });

  test('renders file upload area when no file selected', () => {
    renderConversionPage();
    
    // Check if file upload area is rendered
    expect(screen.getByText('Upload Your File')).toBeInTheDocument();
    expect(screen.getByText('Select a PDF file to convert to an editable Word document')).toBeInTheDocument();
  });

  test('should handle file upload correctly', async () => {
    renderConversionPage();
    
    // Mock successful upload response
    apiService.uploadFile.mockImplementation(({ onSuccess }) => {
      // Simulate successful upload
      onSuccess({
        data: {
          data: {
            conversionId: 'test-conversion-id'
          }
        }
      });
    });

    // Mock successful conversion status
    apiService.getConversionStatus.mockResolvedValue({
      data: {
        status: 'completed',
        resultFile: {
          id: 'test-file-id'
        }
      }
    });

    // Mock successful download token
    apiService.getDownloadToken.mockResolvedValue({
      data: {
        downloadUrl: 'http://example.com/download'
      }
    });

    // Find the file input and simulate file upload
    const fileInput = screen.getByLabelText(/upload your pdf file/i, { selector: 'input' });
    const file = createTestFile();
    
    // Upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the file to be processed
    await waitFor(() => {
      // After file selection, the convert button should appear
      expect(screen.getByText('Convert Now')).toBeInTheDocument();
    });
    
    // Click the convert button
    fireEvent.click(screen.getByText('Convert Now'));
    
    // Verify conversion was started
    expect(apiService.uploadFile).toHaveBeenCalled();
    
    // Wait for conversion to complete
    await waitFor(() => {
      expect(apiService.getDownloadToken).toHaveBeenCalled();
    });
  });

  test('should show error message when conversion fails', async () => {
    renderConversionPage();
    
    // Mock failed upload
    apiService.uploadFile.mockImplementation(({ onError }) => {
      // Simulate error
      onError(new Error('Conversion failed'));
    });

    // Find the file input and simulate file upload
    const fileInput = screen.getByLabelText(/upload your pdf file/i, { selector: 'input' });
    const file = createTestFile();
    
    // Upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the file to be processed
    await waitFor(() => {
      // After file selection, the convert button should appear
      expect(screen.getByText('Convert Now')).toBeInTheDocument();
    });
    
    // Click the convert button
    fireEvent.click(screen.getByText('Convert Now'));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/An error occurred during conversion/i)).toBeInTheDocument();
    });
  });

  test('should handle file removal correctly', async () => {
    renderConversionPage();
    
    // Find the file input and simulate file upload
    const fileInput = screen.getByLabelText(/upload your pdf file/i, { selector: 'input' });
    const file = createTestFile();
    
    // Upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the file to be processed
    await waitFor(() => {
      // After file selection, the Remove button should appear
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
    
    // Click the remove button
    fireEvent.click(screen.getByText('Remove'));
    
    // Verify file was removed - file upload area should reappear
    await waitFor(() => {
      expect(screen.getByText('Upload Your File')).toBeInTheDocument();
    });
  });

  test('progress indicator updates correctly during conversion', async () => {
    renderConversionPage();
    
    // Mock upload with progress
    apiService.uploadFile.mockImplementation(({ onProgress, onSuccess }) => {
      // Simulate progress updates
      onProgress({ loaded: 256, total: 1024, percentage: 25 });
      onProgress({ loaded: 512, total: 1024, percentage: 50 });
      onProgress({ loaded: 768, total: 1024, percentage: 75 });
      onProgress({ loaded: 1024, total: 1024, percentage: 100 });
      
      // Simulate success
      onSuccess({
        data: {
          data: {
            conversionId: 'test-conversion-id'
          }
        }
      });
    });

    // Mock successful status
    apiService.getConversionStatus.mockResolvedValue({
      data: {
        status: 'completed',
        resultFile: {
          id: 'test-file-id'
        }
      }
    });

    // Mock successful download
    apiService.getDownloadToken.mockResolvedValue({
      data: {
        downloadUrl: 'http://example.com/download'
      }
    });

    // Find the file input and simulate file upload
    const fileInput = screen.getByLabelText(/upload your pdf file/i, { selector: 'input' });
    const file = createTestFile();
    
    // Upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the file to be processed
    await waitFor(() => {
      expect(screen.getByText('Convert Now')).toBeInTheDocument();
    });
    
    // Click the convert button
    fireEvent.click(screen.getByText('Convert Now'));
    
    // Check for progress indicator
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
    
    // Wait for conversion to complete
    await waitFor(() => {
      expect(screen.getByText(/conversion successful/i)).toBeInTheDocument();
    });
  });

  test('should cancel conversion when cancel button is clicked', async () => {
    renderConversionPage();
    
    // Setup the cancel token
    const cancelMock = vi.fn();
    apiService.createCancelToken.mockReturnValue({
      token: 'mock-token',
      cancel: cancelMock,
    });
    
    // Mock upload with slow progress
    apiService.uploadFile.mockImplementation(({ onProgress }) => {
      // Only start progress - don't complete
      onProgress({ loaded: 256, total: 1024, percentage: 25 });
    });

    // Find the file input and simulate file upload
    const fileInput = screen.getByLabelText(/upload your pdf file/i, { selector: 'input' });
    const file = createTestFile();
    
    // Upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the file to be processed
    await waitFor(() => {
      expect(screen.getByText('Convert Now')).toBeInTheDocument();
    });
    
    // Click the convert button
    fireEvent.click(screen.getByText('Convert Now'));
    
    // Wait for cancel button to appear
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    
    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify cancel was called
    expect(cancelMock).toHaveBeenCalledWith('Cancelled by user');
  });

  test('renders responsive layout correctly', async () => {
    // This is a basic test for responsive layout
    // In a real-world scenario, you would use testing-library/react with 
    // a tool like jest-dom-testing-library-viewport to test different screen sizes
    
    const { container } = renderConversionPage();
    
    // Check that the container has the responsive classes
    expect(container.querySelector('.py-8.md\\:py-12')).toBeInTheDocument();
    expect(container.querySelector('.container.mx-auto')).toBeInTheDocument();
    
    // Check for responsive grid classes
    expect(container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3')).toBeInTheDocument();
  });
});