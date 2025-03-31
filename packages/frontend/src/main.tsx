import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import remoteLogger from './utils/remoteLogger'
import { initSentry } from './utils/sentry'
import { FeedbackProvider } from './context/FeedbackContext'

// Initialize Sentry
initSentry()

// Initialize remote logging
remoteLogger.info('Application starting', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || 'unknown'
})

// Add initialization log
console.log('PDFSpark initialized with remote logging enabled')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FeedbackProvider>
      {/*
        Using BrowserRouter with basename for subdirectory deployment:
        - Enables clean URLs without hash fragments
        - Requires basename configuration for subdirectory deployment
        - Requires server-side configuration for direct URL access
      */}
      <BrowserRouter basename="/pdfspark">
        <App />
      </BrowserRouter>
    </FeedbackProvider>
  </React.StrictMode>,
)