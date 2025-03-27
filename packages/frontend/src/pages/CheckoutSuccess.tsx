import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '@components/ui/Button';
import { usePaymentStore } from '../store/subscriptionStore';
import { getDownloadToken } from '@services/api';

interface DownloadLink {
  id: string;
  url: string;
  expiresAt: string;
  name: string;
}

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const { fetchPaymentStatus, currentPayment, isLoading, error } = usePaymentStore();
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  
  // Extract conversion ID from URL search params
  const searchParams = new URLSearchParams(location.search);
  const conversionId = searchParams.get('conversion_id');
  
  useEffect(() => {
    // Fetch the payment status when the page loads if conversionId is available
    const loadPaymentData = async () => {
      if (conversionId) {
        const payment = await fetchPaymentStatus(conversionId);
        
        // If payment is complete, generate download links
        if (payment && payment.status === 'completed') {
          generateDownloadLinks(conversionId);
        }
      }
    };
    
    loadPaymentData();
    
    // Set up countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Navigate to the conversion page with the conversion ID if available
          if (conversionId) {
            navigate(`/convert/${conversionId}`);
          } else {
            navigate('/convert');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [fetchPaymentStatus, navigate, conversionId]);
  
  // Function to generate secure download links
  const generateDownloadLinks = async (conversionId: string) => {
    try {
      setGeneratingLinks(true);
      
      // First, get the conversion status which has the file ID
      const response = await getDownloadToken(conversionId, 60 * 24); // 24 hour expiry
      
      if (response && response.success && response.data) {
        // Create download link object
        const link: DownloadLink = {
          id: response.data.fileId || conversionId,
          url: response.data.downloadUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          name: response.data.fileName || 'Converted Document'
        };
        
        setDownloadLinks([link]);
        
        // Also save to localStorage for future reference
        const savedLinks = JSON.parse(localStorage.getItem('downloadLinks') || '[]');
        savedLinks.push(link);
        localStorage.setItem('downloadLinks', JSON.stringify(savedLinks));
      }
    } catch (err) {
      console.error('Failed to generate download links:', err);
    } finally {
      setGeneratingLinks(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
            <svg className="h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-center text-md text-gray-600">
            Thank you for your payment to PDFSpark.
          </p>
        </div>
        
        {isLoading || generatingLinks ? (
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">{isLoading ? 'Verifying payment...' : 'Generating your download links...'}</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700">
            {error}
          </div>
        ) : currentPayment ? (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-green-800">
              You have successfully paid <strong>{currentPayment.amount} {currentPayment.currency.toUpperCase()}</strong>.
            </p>
            <p className="text-green-700 text-sm mt-2">
              Your conversion is now ready for download.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
            Your payment is being processed. It may take a few moments to be applied to your conversion.
          </div>
        )}
        
        {downloadLinks.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-blue-800 font-medium mb-2">Your Download Links</h3>
            <p className="text-blue-700 text-sm mb-4">
              These secure links will expire in 24 hours.
            </p>
            
            <div className="space-y-3">
              {downloadLinks.map(link => (
                <div key={link.id} className="bg-white p-3 rounded shadow-sm">
                  <p className="font-medium text-gray-900 text-sm truncate mb-1">{link.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Expires {new Date(link.expiresAt).toLocaleString()}
                    </span>
                    <a 
                      href={link.url} 
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-gray-500">
            Redirecting to your conversion in {countdown} seconds...
          </p>
          
          <div className="flex space-x-4">
            {conversionId ? (
              <Link to={`/convert/${conversionId}`} className="w-full">
                <Button variant="primary" fullWidth>
                  View Your Conversion
                </Button>
              </Link>
            ) : (
              <Link to="/convert" className="w-full">
                <Button variant="primary" fullWidth>
                  Back to Conversions
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex justify-between text-sm">
            <Link to="/account" className="text-primary-600 hover:text-primary-500 font-medium">
              View payment history
            </Link>
            <Link to="/account/downloads" className="text-primary-600 hover:text-primary-500 font-medium">
              Manage downloads
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;