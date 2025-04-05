import { Routes, Route } from 'react-router-dom';
import HomePage from '@pages/Home';
import NotFoundPage from '@pages/NotFound';
import ConversionPage from '@pages/Conversion';
import PricingPage from '@pages/Pricing';
import AboutPage from '@pages/About';
import Health from '@pages/Health';
import CheckoutSuccessPage from '@pages/CheckoutSuccess';
import CheckoutPage from '@pages/Checkout';
import ProductPage from '@pages/ProductPage';
import AccountPage from '@pages/Account';
import Layout from '@components/layout/Layout';
import useAnalytics from '@hooks/useAnalytics';

// Main App component with routing
// Note: BrowserRouter with basename="/pdfspark" is configured in main.tsx
function App(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<AnalyticsLayout />}>
        <Route index element={<HomePage />} />
        <Route path="convert" element={<ConversionPage />} />
        <Route path="convert/:id" element={<ConversionPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="product" element={<ProductPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="account/downloads" element={<AccountPage />} />
        <Route path="health" element={<Health />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

// Wrapper component to initialize analytics after Router is initialized
function AnalyticsLayout(): React.ReactElement {
  try {
    // Initialize analytics tracking (now safely within Router context)
    useAnalytics();
  } catch (error) {
    // Silently handle analytics errors so they don't break the app
    console.warn('Analytics initialization error:', error);
  }
  
  return <Layout />;
}

export default App;