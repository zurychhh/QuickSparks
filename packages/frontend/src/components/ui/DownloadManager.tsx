import React, { useState, useEffect } from 'react';
import Button from './Button';

interface DownloadLink {
  id: string;
  url: string;
  expiresAt: string;
  name: string;
}

interface DownloadManagerProps {
  className?: string;
}

/**
 * Component to manage secure download links
 */
const DownloadManager: React.FC<DownloadManagerProps> = ({ className = '' }) => {
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [hasExpired, setHasExpired] = useState<Record<string, boolean>>({});
  
  // Load saved download links from localStorage
  useEffect(() => {
    const loadSavedLinks = () => {
      try {
        const saved = localStorage.getItem('downloadLinks');
        if (saved) {
          const links = JSON.parse(saved) as DownloadLink[];
          
          // Filter out expired links
          const now = new Date();
          const validLinks = links.filter(link => {
            const expiry = new Date(link.expiresAt);
            return expiry > now;
          });
          
          // Update localStorage if we filtered some links
          if (validLinks.length !== links.length) {
            localStorage.setItem('downloadLinks', JSON.stringify(validLinks));
          }
          
          setDownloadLinks(validLinks);
          
          // Check for almost expired links
          const expiryStatus: Record<string, boolean> = {};
          validLinks.forEach(link => {
            const expiry = new Date(link.expiresAt);
            const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
            expiryStatus[link.id] = hoursRemaining < 2; // Flag as "expiring soon" if less than 2 hours
          });
          
          setHasExpired(expiryStatus);
        }
      } catch (error) {
        console.error('Failed to load download links:', error);
      }
    };
    
    loadSavedLinks();
    
    // Set up an interval to check for expired links periodically
    const interval = setInterval(loadSavedLinks, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle delete link
  const handleDelete = (id: string) => {
    const updatedLinks = downloadLinks.filter(link => link.id !== id);
    setDownloadLinks(updatedLinks);
    localStorage.setItem('downloadLinks', JSON.stringify(updatedLinks));
  };
  
  // Handle clear all
  const handleClearAll = () => {
    setDownloadLinks([]);
    localStorage.removeItem('downloadLinks');
  };
  
  // If no download links
  if (downloadLinks.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Downloads</h2>
        <div className="py-6 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">You have no active downloads</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Your Downloads</h2>
        {downloadLinks.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {downloadLinks.map(link => (
          <div key={link.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{link.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Expires: {new Date(link.expiresAt).toLocaleString()}
                  {hasExpired[link.id] && (
                    <span className="ml-2 text-orange-500 font-medium">Expiring soon!</span>
                  )}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {hasExpired[link.id] && (
              <div className="mt-3 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                This download link will expire soon. Please download your file now to avoid losing access.
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">About Secure Downloads</h3>
        <p className="text-sm text-gray-600">
          Your download links are secure and will expire after their set timeframe for security reasons. 
          Make sure to download your files before they expire.
        </p>
      </div>
    </div>
  );
};

export default DownloadManager;