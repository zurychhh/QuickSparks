import React, { useState, useEffect } from 'react';
import Button from './Button';
import { usePaymentStore } from '../../store/subscriptionStore';

interface PaymentButtonProps {
  conversionId: string;
  onPaymentInitiated?: () => void;
  onPaymentCompleted?: () => void;
  disabled?: boolean;
  showPrice?: boolean;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  fullWidth?: boolean;
  className?: string;
}

/**
 * A button component that initiates the payment flow for a conversion
 */
const PaymentButton: React.FC<PaymentButtonProps> = ({
  conversionId,
  onPaymentInitiated,
  onPaymentCompleted,
  disabled = false,
  showPrice = true,
  buttonText = 'Pay to Download',
  variant = 'primary',
  fullWidth = false,
  className
}) => {
  const { createCheckout, fetchProductInfo, productInfo, fetchPaymentStatus, currentPayment, isLoading, error } = usePaymentStore();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);

  // Fetch product info on mount
  useEffect(() => {
    fetchProductInfo();
  }, [fetchProductInfo]);

  // Check payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (conversionId) {
        const payment = await fetchPaymentStatus(conversionId);
        if (payment) {
          setPaymentStatus(payment.status as 'pending' | 'completed' | 'failed');
          if (payment.status === 'completed' && onPaymentCompleted) {
            onPaymentCompleted();
          }
        } else {
          setPaymentStatus(null);
        }
      }
    };

    checkPaymentStatus();
  }, [conversionId, fetchPaymentStatus, onPaymentCompleted]);

  const handlePaymentClick = async () => {
    try {
      if (onPaymentInitiated) {
        onPaymentInitiated();
      }
      
      const checkoutUrl = await createCheckout(conversionId);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  // Display a download button if payment is already completed
  if (paymentStatus === 'completed') {
    return (
      <Button
        variant="primary"
        onClick={onPaymentCompleted}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        Download
      </Button>
    );
  }

  // Display payment button
  return (
    <Button
      variant={variant}
      onClick={handlePaymentClick}
      disabled={disabled || isLoading}
      fullWidth={fullWidth}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {buttonText}
          {showPrice && productInfo && (
            <span className="ml-2 text-sm opacity-90">
              ({productInfo.price.amount} {productInfo.price.currency.toUpperCase()})
            </span>
          )}
        </div>
      )}
    </Button>
  );
};

export default PaymentButton;