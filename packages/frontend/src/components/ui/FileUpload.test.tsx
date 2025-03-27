import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FileUpload from './FileUpload';
import { FeedbackProvider } from '../../context/FeedbackContext';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  default: ({ onDrop, accept, children }: any) => {
    return (
      <div
        data-testid="dropzone"
        onClick={() => {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = Object.keys(accept).join(',');
          
          // Simulate user selecting files
          fileInput.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              onDrop(
                Array.from(target.files),
                [],
                { acceptedFiles: Array.from(target.files), rejectedFiles: [] } as any
              );
            }
          };
          
          fireEvent.click(fileInput);
        }}
      >
        {children({ getRootProps: () => ({}), getInputProps: () => ({}) })}
      </div>
    );
  },
}));

// Mock FeedbackAnimation component
vi.mock('../../components/ui/FeedbackAnimation', () => ({
  default: vi.fn(({ type, message, show }) =>
    show ? (
      <div data-testid="mock-feedback" data-type={type}>
        {message}
      </div>
    ) : null,
  ),
}));

// Mock file for testing
function createMockFile(name = 'test.pdf', type = 'application/pdf', size = 1024) {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the dropzone correctly', () => {
    const handleFileSelect = vi.fn();
    render(
      <FeedbackProvider>
        <FileUpload onFileSelect={handleFileSelect} />
      </FeedbackProvider>
    );

    // Check if the dropzone is rendered
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    
    // Check if the main instruction text is present
    expect(screen.getByText(/Drag and drop your PDF files here/i)).toBeInTheDocument();
    
    // Check if the alternative upload method is shown
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('accepts PDF files and calls onFileSelect', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FeedbackProvider>
        <FileUpload onFileSelect={handleFileSelect} />
      </FeedbackProvider>
    );

    const dropzone = screen.getByTestId('dropzone');
    const mockFile = createMockFile();

    // Simulate file drop
    await act(async () => {
      // @ts-ignore - we're simulating FileList which is difficult to create in tests
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      
      // We're calling the onClick handler which simulates the file selection
      fireEvent.click(dropzone);
      
      // Create a new file input event with our mock file
      const fileInputEvent = { target: { files: [mockFile] } };
      
      // Find any file inputs in the document after the click and trigger change
      const fileInputs = document.querySelectorAll('input[type="file"]');
      if (fileInputs.length > 0) {
        fireEvent.change(fileInputs[0], fileInputEvent);
      }
    });

    // Check if onFileSelect was called with the correct file
    expect(handleFileSelect).toHaveBeenCalledWith(mockFile);
  });

  it('shows error for unsupported file types', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FeedbackProvider>
        <FileUpload onFileSelect={handleFileSelect} />
      </FeedbackProvider>
    );

    const dropzone = screen.getByTestId('dropzone');
    const mockImageFile = createMockFile('test.jpg', 'image/jpeg');

    // Simulate file drop with unsupported file type
    await act(async () => {
      fireEvent.click(dropzone);
      
      // Create a new file input event with our mock file
      const fileInputEvent = { target: { files: [mockImageFile] } };
      
      // Find any file inputs in the document after the click and trigger change
      const fileInputs = document.querySelectorAll('input[type="file"]');
      if (fileInputs.length > 0) {
        fireEvent.change(fileInputs[0], fileInputEvent);
      }
    });

    // Check if the error message is shown
    expect(screen.queryByTestId('mock-feedback')).toBeInTheDocument();
    expect(handleFileSelect).not.toHaveBeenCalled();
  });

  it('shows error for files larger than the limit', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FeedbackProvider>
        <FileUpload onFileSelect={handleFileSelect} maxSize={1000} />
      </FeedbackProvider>
    );

    const dropzone = screen.getByTestId('dropzone');
    // Create a file that's larger than the limit (1000 bytes)
    const mockLargeFile = createMockFile('large.pdf', 'application/pdf', 1500);

    // Simulate file drop with a large file
    await act(async () => {
      fireEvent.click(dropzone);
      
      // Create a new file input event with our mock file
      const fileInputEvent = { target: { files: [mockLargeFile] } };
      
      // Find any file inputs in the document after the click and trigger change
      const fileInputs = document.querySelectorAll('input[type="file"]');
      if (fileInputs.length > 0) {
        fireEvent.change(fileInputs[0], fileInputEvent);
      }
    });

    // Check if the error message is shown
    expect(screen.queryByTestId('mock-feedback')).toBeInTheDocument();
    expect(handleFileSelect).not.toHaveBeenCalled();
  });

  it('applies custom classes correctly', () => {
    const handleFileSelect = vi.fn();
    const { container } = render(
      <FeedbackProvider>
        <FileUpload onFileSelect={handleFileSelect} className="custom-class" />
      </FeedbackProvider>
    );

    // The custom class should be applied somewhere in the component hierarchy
    const element = container.querySelector('.custom-class');
    expect(element).toBeTruthy();
  });
});