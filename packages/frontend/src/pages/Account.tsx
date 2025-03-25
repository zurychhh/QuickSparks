import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '@components/ui/Button';
import DownloadManager from '@components/ui/DownloadManager';
import { usePaymentStore, Payment } from '../store/subscriptionStore';

const AccountPage: React.FC = () => {
  const { payments, fetchPaymentHistory, isLoading, error, pagination } = usePaymentStore();
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'payments' | 'downloads'>('payments');
  
  // Determine which tab to show based on the path
  useEffect(() => {
    if (location.pathname.includes('/downloads')) {
      setActiveTab('downloads');
    } else {
      setActiveTab('payments');
    }
  }, [location.pathname]);
  
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPaymentHistory(currentPage, 10);
    }
  }, [fetchPaymentHistory, currentPage, activeTab]);
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Account</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <Link 
          to="/account"
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'payments' 
              ? 'border-b-2 border-primary-500 text-primary-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('payments')}
        >
          Payment History
        </Link>
        <Link 
          to="/account/downloads"
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'downloads' 
              ? 'border-b-2 border-primary-500 text-primary-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('downloads')}
        >
          Downloads
        </Link>
      </div>
      
      {activeTab === 'downloads' ? (
        <DownloadManager className="mb-6" />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
                {error}
                <button 
                  onClick={() => fetchPaymentHistory(currentPage)} 
                  className="ml-2 text-red-700 underline hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No payment records found.</p>
                <Link to="/convert" className="mt-4 inline-block">
                  <Button variant="primary">Start a New Conversion</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conversion
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment: Payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.conversionId ? (
                              <span className="truncate max-w-xs inline-block">
                                {payment.conversionId}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.conversionId && payment.status === 'completed' && (
                              <Link 
                                to={`/convert/${payment.conversionId}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View Conversion
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === pagination.totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * 10, pagination.total)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            // Logic to show pages around current page
                            let pageNum = i + 1;
                            if (pagination.totalPages > 5) {
                              if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === pagination.totalPages 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Call-to-action section */}
      <div className="mt-8 bg-gray-50 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need more conversions?</h3>
        <p className="text-gray-600 mb-4">
          Convert more documents or explore premium features with additional purchases.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/convert">
            <Button variant="primary">Convert Now</Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline">View Pricing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;