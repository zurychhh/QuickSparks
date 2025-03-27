import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileViewerProps {
  fileUrl: string;
  mimeType: string;
  fileName: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileUrl, mimeType, fileName }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading document:', error);
    setError('Failed to load the document. Please try again.');
    setLoading(false);
  };

  const renderFilePreview = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<CircularProgress />}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          {numPages && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Page {pageNumber} of {numPages}
            </Typography>
          )}
        </Box>
      );
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, we can't display them directly, so we show a placeholder
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="400px"
          border="1px dashed #ccc"
          borderRadius="4px"
          p={2}
        >
          <Typography variant="h6">{fileName}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Document preview not available for DOCX files.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You can download the file to view it.
          </Typography>
        </Box>
      );
    } else {
      // For unsupported file types
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="400px"
          border="1px dashed #ccc"
          borderRadius="4px"
          p={2}
        >
          <Typography variant="h6">{fileName}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Preview not available for this file type.
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        File Preview
      </Typography>
      {renderFilePreview()}
    </Paper>
  );
};

export default FileViewer;