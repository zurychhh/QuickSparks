/**
 * Stripe utilities for payment integration
 */

// Function to load Stripe script dynamically
export const loadStripe = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve((window as any).Stripe);
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        if ((window as any).Stripe) {
          resolve((window as any).Stripe);
        } else {
          reject(new Error('Stripe.js failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load Stripe.js'));
      };
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
};

// Initialize Stripe with the publishable key
export const initStripe = async (): Promise<any> => {
  try {
    const Stripe = await loadStripe();
    const stripe = Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    return stripe;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  try {
    const stripe = await initStripe();
    const { error } = await stripe.redirectToCheckout({
      sessionId
    });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error redirecting to Stripe Checkout:', error);
    throw error;
  }
};

export default {
  loadStripe,
  initStripe,
  redirectToCheckout
};