import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '@pages/Home';
import NotFoundPage from '@pages/NotFound';
import ConversionPage from '@pages/Conversion';
import PricingPage from '@pages/Pricing';
import AboutPage from '@pages/About';
import Layout from '@components/layout/Layout';

function App(): React.ReactElement {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="convert" element={<ConversionPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;