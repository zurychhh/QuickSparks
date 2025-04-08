type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

/**
 * Validates a file before starting the upload process
 * @param file - The file to validate
 * @param conversionType - The type of conversion being performed
 * @returns null if valid, error message string if invalid
 * @throws Error with validation message if validation fails
 */
export const validateFileBeforeUpload = (
  file: File | null, 
  conversionType: ConversionType
): string | null => {
  // Basic existence check
  if (!file) throw new Error("No file selected");
  
  // Size validation with configurable limits
  const minSize = 1; // 1 byte
  const maxSize = import.meta.env.VITE_MAX_FILE_SIZE 
    ? parseInt(import.meta.env.VITE_MAX_FILE_SIZE) * 1024 * 1024
    : 50 * 1024 * 1024; // 50MB default
  
  if (file.size < minSize) {
    throw new Error("File is empty. Please select a valid file.");
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
  
  // File name validation
  if (!file.name || file.name.trim().length === 0) {
    throw new Error("File name is missing or invalid");
  }
  
  if (file.name.length > 255) {
    throw new Error("File name too long (maximum 255 characters)");
  }
  
  // Check for potentially unsafe file name characters
  const unsafeChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (unsafeChars.test(file.name)) {
    throw new Error("File name contains invalid characters");
  }
  
  // Type validation based on conversion type
  const acceptedTypes = getAcceptedFileTypes(conversionType);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // First check MIME type
  if (!acceptedTypes.includes(file.type)) {
    if (conversionType === 'pdf-to-docx') {
      throw new Error("Invalid file type. Please select a PDF file.");
    } else {
      throw new Error("Invalid file type. Please select a Word document (DOCX).");
    }
  }
  
  // Then validate extension as a fallback (guard against MIME type spoofing)
  if (conversionType === 'pdf-to-docx' && fileExtension !== 'pdf') {
    throw new Error("Invalid file. Please select a PDF file with .pdf extension.");
  } else if (conversionType === 'docx-to-pdf' && 
             !['docx', 'doc'].includes(fileExtension || '')) {
    throw new Error("Invalid file. Please select a Word document with .docx or .doc extension.");
  }
  
  // Check for empty extension
  if (!fileExtension) {
    throw new Error("File must have an extension");
  }
  
  // Additional file integrity check based on file size for PDFs
  if (conversionType === 'pdf-to-docx' && file.size < 1024) {
    throw new Error("The PDF file appears to be too small to be valid");
  }
  
  // File is valid
  return null;
};

/**
 * Returns accepted MIME types based on conversion direction
 */
export const getAcceptedFileTypes = (conversionType: ConversionType): string[] => {
  if (conversionType === 'pdf-to-docx') {
    return ['application/pdf'];
  } else {
    return [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
  }
};