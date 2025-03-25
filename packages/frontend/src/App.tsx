import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App(): React.ReactElement {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
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
    </Router>
  );
}

export default App;