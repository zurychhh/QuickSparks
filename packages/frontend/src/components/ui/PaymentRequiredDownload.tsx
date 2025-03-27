import React, { useState, useEffect } from 'react';
import PaymentButton from './PaymentButton';
import { usePaymentStore } from '../../store/subscriptionStore';

interface PaymentRequiredDownloadProps {
  conversionId: string;
  onDownload: () => void;
  disableButton?: boolean;
}

/**
 * Component that shows either a download button or payment button depending on payment status
 */
const PaymentRequiredDownload: React.FC<PaymentRequiredDownloadProps> = ({
  conversionId,
  onDownload,
  disableButton = false
}) => {
  const { fetchPaymentStatus, currentPayment, isLoading, error } = usePaymentStore();
  const [isPaid, setIsPaid] = useState(false);
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (conversionId) {
        const payment = await fetchPaymentStatus(conversionId);
        setIsPaid(payment?.status === 'completed');
      }
    };
    
    checkPaymentStatus();
  }, [conversionId, fetchPaymentStatus]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-12">
        <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-2">Checking payment status...</span>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
        <p>Error checking payment status. Please try again.</p>
        <button 
          onClick={() => fetchPaymentStatus(conversionId)}
          className="mt-2 text-primary-600 underline hover:text-primary-800"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // If already paid, show download button
  if (isPaid) {
    return (
      <div className="flex flex-col space-y-2">
        <PaymentButton 
          conversionId={conversionId}
          onPaymentCompleted={onDownload}
          disabled={disableButton}
          buttonText="Download"
          fullWidth
        />
        <p className="text-green-600 text-sm text-center">
          Payment complete! You can download your conversion.
        </p>
      </div>
    );
  }
  
  // Otherwise show payment button
  return (
    <div className="flex flex-col space-y-2">
      <PaymentButton 
        conversionId={conversionId}
        onPaymentCompleted={onDownload}
        disabled={disableButton}
        fullWidth
      />
      <p className="text-gray-500 text-sm text-center">
        One-time payment required to download this conversion.
      </p>
    </div>
  );
};

export default PaymentRequiredDownload;