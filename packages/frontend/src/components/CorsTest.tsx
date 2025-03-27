import React, { useState } from 'react';
import api from '../services/api';
import { API_CONFIG } from '../config/api.config';
import { testCors } from '../services/api';

const CorsTest = () => {
  const [corsStatus, setCorsStatus] = useState('Oczekiwanie na test...');
  const [corsResponse, setCorsResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const runCorsTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test endpointu CORS
      const response = await api.get(API_CONFIG.endpoints.corsTest);
      setCorsStatus('CORS działa poprawnie!');
      setCorsResponse(response.data);
    } catch (err: any) {
      setCorsStatus('CORS test nie powiódł się');
      setError(err.message || 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  };
  
  const runHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test endpointu Health
      const response = await api.get(API_CONFIG.endpoints.health);
      setCorsStatus('Health check działa poprawnie!');
      setCorsResponse(response.data);
    } catch (err: any) {
      setCorsStatus('Health check nie powiódł się');
      setError(err.message || 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  };
  
  const runDebugHeaders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test endpointu Debug Headers
      const response = await api.get(API_CONFIG.endpoints.debugHeaders);
      setCorsStatus('Debug Headers działa poprawnie!');
      setCorsResponse(response.data);
    } catch (err: any) {
      setCorsStatus('Debug Headers nie powiódł się');
      setError(err.message || 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg mb-6 bg-gray-50">
      <h2 className="text-xl font-bold mb-3">Test CORS</h2>
      <div className="mb-4">
        <div className="font-semibold">Status: 
          <span className={`ml-2 ${
            corsStatus.includes('działa') ? 'text-green-600' : 
            corsStatus.includes('nie') ? 'text-red-600' : 'text-gray-600'
          }`}>
            {corsStatus}
          </span>
        </div>
        {error && (
          <div className="mt-2 text-red-600">
            <div className="font-semibold">Błąd:</div>
            <div className="text-sm">{error}</div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={runCorsTest}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testowanie...' : 'Test CORS'}
        </button>
        
        <button
          onClick={runHealthCheck}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Testowanie...' : 'Test Health'}
        </button>
        
        <button
          onClick={runDebugHeaders}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? 'Testowanie...' : 'Test Headers'}
        </button>
        
        <button
          onClick={() => testCors()}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {isLoading ? 'Testowanie...' : 'Quick Test'}
        </button>
      </div>
      
      {corsResponse && (
        <div>
          <div className="font-semibold mb-2">Odpowiedź:</div>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(corsResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CorsTest;