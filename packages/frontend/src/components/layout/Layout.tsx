import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBanner from '../ui/ErrorBanner';

/**
 * Main layout component that wraps all pages
 */
const Layout = (): React.ReactElement => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-2">
          <ErrorBanner />
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;