type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

/**
 * Validates a file before starting the upload process
 * @param file - The file to validate
 * @param conversionType - The type of conversion being performed
 * @returns null if valid, error message string if invalid
 */
export const validateFileBeforeUpload = (
  file: File | null, 
  conversionType: ConversionType
): string | null => {
  // Basic existence check
  if (!file) return "No file selected";
  
  // Size validation
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  
  // File name validation
  if (file.name.length > 255) {
    return "File name too long";
  }
  
  // Type validation based on conversion type
  const acceptedTypes = getAcceptedFileTypes(conversionType);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!acceptedTypes.includes(file.type)) {
    if (conversionType === 'pdf-to-docx') {
      return "Invalid file type. Please select a PDF file.";
    } else {
      return "Invalid file type. Please select a Word document (DOCX).";
    }
  }
  
  // Perform extension validation as a fallback
  if (conversionType === 'pdf-to-docx' && fileExtension !== 'pdf') {
    return "Invalid file. Please select a PDF file with .pdf extension.";
  } else if (conversionType === 'docx-to-pdf' && 
             !['docx', 'doc'].includes(fileExtension || '')) {
    return "Invalid file. Please select a Word document with .docx or .doc extension.";
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