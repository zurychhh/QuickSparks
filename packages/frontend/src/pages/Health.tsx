import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface HealthStatus {
  status: string;
  frontend: {
    uptime: number;
    timestamp: number;
    version: string;
  };
  api?: {
    status: string;
    uptime: number;
    database: string;
    version: string;
  };
}

const Health: React.FC = (): React.ReactElement => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'loading',
    frontend: {
      uptime: 0,
      timestamp: Date.now(),
      version: import.meta.env.VITE_APP_VERSION || '0.1.0',
    },
  });

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/health`);
        setHealth({
          status: 'ok',
          frontend: {
            uptime: performance.now() / 1000, // convert ms to seconds
            timestamp: Date.now(),
            version: import.meta.env.VITE_APP_VERSION || '0.1.0',
          },
          api: response.data,
        });
      } catch (error) {
        setHealth({
          status: 'error',
          frontend: {
            uptime: performance.now() / 1000,
            timestamp: Date.now(),
            version: import.meta.env.VITE_APP_VERSION || '0.1.0',
          },
        });
        console.error('API health check failed:', error);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-xl font-bold mb-4">System Health</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Status: 
          <span className={`ml-2 ${health.status === 'ok' ? 'text-green-500' : health.status === 'loading' ? 'text-yellow-500' : 'text-red-500'}`}>
            {health.status === 'ok' ? 'All Systems Operational' : health.status === 'loading' ? 'Checking...' : 'System Issues Detected'}
          </span>
        </h2>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">Frontend</h3>
        <ul className="list-disc ml-5">
          <li>Version: {health.frontend.version}</li>
          <li>Uptime: {Math.floor(health.frontend.uptime)} seconds</li>
          <li>Timestamp: {new Date(health.frontend.timestamp).toLocaleString()}</li>
        </ul>
      </div>
      
      {health.api && (
        <div>
          <h3 className="font-semibold">API</h3>
          <ul className="list-disc ml-5">
            <li>Status: {health.api.status}</li>
            <li>Version: {health.api.version}</li>
            <li>Uptime: {Math.floor(health.api.uptime)} seconds</li>
            <li>Database: 
              <span className={`ml-1 ${health.api.database === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                {health.api.database}
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Health;