import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { usePaymentStore } from '../../store/subscriptionStore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  type: 'conversion' | 'product';
}

interface CartProps {
  items: CartItem[];
  onCheckout: () => void;
  onRemoveItem?: (id: string) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  className?: string;
}

/**
 * Simple shopping cart component for purchase flow
 */
const Cart: React.FC<CartProps> = ({
  items,
  onCheckout,
  onRemoveItem,
  onUpdateQuantity,
  className = ''
}) => {
  const { isLoading } = usePaymentStore();
  const [total, setTotal] = useState<number>(0);
  
  // Calculate total whenever items change
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [items]);
  
  // Currency formatter
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // If cart is empty
  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Cart</h2>
        <div className="py-6 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link to="/convert">
            <Button variant="outline" size="md">
              Start Converting
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Your Cart</h2>
      
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.id} className="py-4 flex justify-between">
            <div className="flex-1">
              <h3 className="text-md font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(item.price, item.currency)} {item.quantity > 1 && `× ${item.quantity}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Show quantity inputs only for products, not conversions */}
              {item.type === 'product' && onUpdateQuantity && (
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                    onClick={() => item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-2 py-1 text-gray-900">{item.quantity}</span>
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              )}
              
              {onRemoveItem && (
                <button
                  className="text-sm text-gray-500 hover:text-red-500"
                  onClick={() => onRemoveItem(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
          <p>Subtotal</p>
          <p>{formatCurrency(total, items[0]?.currency || 'USD')}</p>
        </div>
        
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onCheckout}
          disabled={isLoading}
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
            'Proceed to Checkout'
          )}
        </Button>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            All payments are secure and encrypted. 
            <br />
            We accept all major credit cards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;