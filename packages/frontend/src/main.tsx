import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
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
        Zastosowanie HashRouter zamiast BrowserRouter:
        - Rozwiązuje problemy z MIME types
        - Nie wymaga konfiguracji basename
        - Linki będą miały format /#/scieżka zamiast /scieżka
      */}
      <HashRouter basename="/pdfspark">
        <App />
      </HashRouter>
    </FeedbackProvider>
  </React.StrictMode>,
)