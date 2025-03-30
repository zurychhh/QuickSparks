import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { initSentry } from './utils/sentry'
import { FeedbackProvider } from './context/FeedbackContext'

// Initialize Sentry
initSentry()

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