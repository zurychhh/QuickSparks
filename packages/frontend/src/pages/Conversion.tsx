import React from 'react';
import { useParams } from 'react-router-dom';
import ConversionForm from '../components/ui/ConversionForm';
import { useFeedback } from '../context/FeedbackContext';
import Card from '../components/ui/Card';

/**
 * ConversionPage component
 * Main page for file conversion functionality with robust error handling
 */
const ConversionPage: React.FC = () => {
  // Get conversion ID from URL if available
  const { id: conversionId } = useParams<{ id?: string }>();
  
  // Access feedback context for notifications
  const feedbackContext = useFeedback();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          PDFSpark Document Conversion
        </h1>
        
        <Card>
          <ConversionForm 
            initialConversionId={conversionId}
          />
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help? <a href="/help" className="text-primary-600 hover:text-primary-700">Visit our help center</a> or <a href="/contact" className="text-primary-600 hover:text-primary-700">contact support</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversionPage;