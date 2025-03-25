import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '@components/ui/Button';
import { usePaymentStore } from '../store/subscriptionStore';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const { fetchPaymentStatus, currentPayment, isLoading, error } = usePaymentStore();
  
  // Extract conversion ID from URL search params
  const searchParams = new URLSearchParams(location.search);
  const conversionId = searchParams.get('conversion_id');
  
  useEffect(() => {
    // Fetch the payment status when the page loads if conversionId is available
    if (conversionId) {
      fetchPaymentStatus(conversionId);
    }
    
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
        
        {isLoading ? (
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
          
          <div className="text-center">
            <Link to="/account" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
              View payment history
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;