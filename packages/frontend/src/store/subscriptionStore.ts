import { create } from 'zustand';
import { 
  getPaymentHistory, 
  createPaymentCheckout, 
  getPaymentStatus,
  getProductInfo
} from '../services/api';
import { redirectToCheckout } from '../utils/stripe';

export interface Payment {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  conversionId?: string;
  createdAt: string;
}

export interface ProductInfo {
  product: {
    id: string;
    name: string;
    description?: string;
  };
  price: {
    id: string;
    amount: number;
    currency: string;
  };
}

interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  productInfo: ProductInfo | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
  
  // Actions
  fetchPaymentHistory: (page?: number, limit?: number) => Promise<void>;
  fetchPaymentStatus: (conversionId: string) => Promise<Payment | null>;
  createCheckout: (conversionId: string) => Promise<string>;
  fetchProductInfo: () => Promise<ProductInfo | null>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  currentPayment: null,
  productInfo: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 0,
  },
  
  fetchPaymentHistory: async (page = 1, limit = 10) => {
    try {
      set({ isLoading: true, error: null });
      const response = await getPaymentHistory(page, limit);
      
      if (response.success) {
        set({ 
          payments: response.data,
          pagination: response.pagination || {
            total: response.data.length,
            page,
            totalPages: Math.ceil(response.data.length / limit)
          },
          isLoading: false 
        });
      } else {
        throw new Error(response.message || 'Failed to fetch payment history');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch payment history',
        isLoading: false 
      });
    }
  },
  
  fetchPaymentStatus: async (conversionId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await getPaymentStatus(conversionId);
      
      if (response.success) {
        const payment = response.data;
        set({ 
          currentPayment: payment,
          isLoading: false 
        });
        return payment;
      } else {
        set({ 
          currentPayment: null,
          isLoading: false 
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch payment status',
        isLoading: false,
        currentPayment: null
      });
      return null;
    }
  },
  
  createCheckout: async (conversionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Base URL for success and cancel URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/checkout/success?conversion_id=${conversionId}`;
      const cancelUrl = `${baseUrl}/convert`;
      
      const response = await createPaymentCheckout(conversionId, successUrl, cancelUrl);
      
      if (response.success && response.data && response.data.url) {
        // Return the URL for redirection
        set({ isLoading: false });
        return response.data.url;
      } else {
        throw new Error('Invalid response from checkout creation');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        isLoading: false 
      });
      throw error;
    }
  },
  
  fetchProductInfo: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await getProductInfo();
      
      if (response.success && response.data) {
        const productInfo = response.data;
        set({ 
          productInfo,
          isLoading: false 
        });
        return productInfo;
      } else {
        set({ isLoading: false });
        return null;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch product information',
        isLoading: false 
      });
      return null;
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  // New action to set API errors
  setApiError: (message: string) => {
    set({ 
      error: message,
      isLoading: false
    });
    
    // Auto-clear error after 10 seconds
    setTimeout(() => {
      // Only clear if it's still the same error
      // This prevents clearing new errors that might have appeared
      usePaymentStore.getState().error === message && 
        usePaymentStore.setState({ error: null });
    }, 10000);
  }
}));

// Export legacy subscription store for backwards compatibility
export const useSubscriptionStore = create((set) => ({
  subscription: null,
  isLoading: false,
  error: null,
  
  fetchSubscription: async () => {
    set({ subscription: null, error: 'Subscription model has been deprecated' });
  },
  
  createCheckout: async () => {
    set({ error: 'Subscription model has been deprecated' });
    throw new Error('Subscription model has been deprecated');
  },
  
  cancelUserSubscription: async () => {
    set({ error: 'Subscription model has been deprecated' });
    return false;
  },
  
  openCustomerPortal: async () => {
    set({ error: 'Subscription model has been deprecated' });
    throw new Error('Subscription model has been deprecated');
  }
}));