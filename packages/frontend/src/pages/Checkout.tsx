import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '@components/ui/Button';
import Cart from '@components/ui/Cart';
import { usePaymentStore } from '../store/subscriptionStore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  type: 'conversion' | 'product';
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createCheckout, isLoading, error, clearError, productInfo, fetchProductInfo } = usePaymentStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // On mount, retrieve cart items from location state or localStorage
  useEffect(() => {
    const fetchData = async () => {
      // Get product info if we don't have it yet
      if (!productInfo) {
        await fetchProductInfo();
      }
      
      // Get cart items from location state
      if (location.state && location.state.cartItems) {
        setCartItems(location.state.cartItems);
        return;
      }
      
      // Try to get cart items from localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
          return;
        } catch (err) {
          console.error('Failed to parse saved cart:', err);
        }
      }
      
      // If we get here and have no items, redirect to home
      if (!location.state?.conversionId) {
        navigate('/');
      }
    };
    
    fetchData();
  }, [location.state, navigate, productInfo, fetchProductInfo]);
  
  // Add conversion to cart if it's in the location state
  useEffect(() => {
    if (location.state?.conversionId && productInfo) {
      // Check if this conversion is already in the cart
      const existingItem = cartItems.find(item => 
        item.id === location.state.conversionId && item.type === 'conversion'
      );
      
      if (!existingItem) {
        const conversionItem: CartItem = {
          id: location.state.conversionId,
          name: `Document Conversion: ${location.state.fileName || 'File'}`,
          price: productInfo.price.amount,
          currency: productInfo.price.currency,
          quantity: 1,
          type: 'conversion'
        };
        
        setCartItems(prev => [...prev, conversionItem]);
      }
    }
  }, [location.state, cartItems, productInfo]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);
  
  // Handle removing an item from cart
  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    
    // If cart becomes empty, redirect to home
    if (cartItems.length <= 1) {
      // We need to wait for state update, so use setTimeout
      setTimeout(() => navigate('/'), 0);
    }
  };
  
  // Handle quantity update
  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  // Handle checkout
  const handleCheckout = async () => {
    try {
      clearError();
      
      // For conversions, use the conversion checkout flow
      const conversionItems = cartItems.filter(item => item.type === 'conversion');
      
      if (conversionItems.length > 0) {
        // Currently we only support one conversion at a time
        const conversionId = conversionItems[0].id;
        
        // Base URL for success and cancel URLs
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/checkout/success?conversion_id=${conversionId}`;
        const cancelUrl = `${baseUrl}/checkout?conversionId=${conversionId}`;
        
        // Create checkout session and redirect
        const checkoutUrl = await createCheckout(conversionId);
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
          
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <Cart
                items={cartItems}
                onCheckout={handleCheckout}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                className="border-none p-0 shadow-none"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
              
              <div className="p-4 bg-gray-50 rounded-md mb-6">
                <p className="text-sm text-gray-600">
                  We accept all major credit cards and process payments securely through our payment provider.
                  No payment information is stored on our servers.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <img src="/images/visa.svg" alt="Visa" className="h-8" 
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none"%3e%3crect width="60" height="40" rx="4" fill="%23e2e8f0"/%3e%3ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14px" fill="%236b7280"%3eVISA%3c/text%3e%3c/svg%3e';
                  }}
                />
                <img src="/images/mastercard.svg" alt="Mastercard" className="h-8"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none"%3e%3crect width="60" height="40" rx="4" fill="%23e2e8f0"/%3e%3ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14px" fill="%236b7280"%3eMC%3c/text%3e%3c/svg%3e';
                  }}
                />
                <img src="/images/amex.svg" alt="American Express" className="h-8"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none"%3e%3crect width="60" height="40" rx="4" fill="%23e2e8f0"/%3e%3ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14px" fill="%236b7280"%3eAMEX%3c/text%3e%3c/svg%3e';
                  }}
                />
                <img src="/images/paypal.svg" alt="PayPal" className="h-8"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none"%3e%3crect width="60" height="40" rx="4" fill="%23e2e8f0"/%3e%3ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14px" fill="%236b7280"%3ePayPal%3c/text%3e%3c/svg%3e';
                  }}
                />
              </div>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCheckout}
            disabled={isLoading || cartItems.length === 0}
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
              'Complete Purchase'
            )}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By completing your purchase, you agree to our {' '}
              <a href="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>
              {' '} and {' '}
              <a href="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;