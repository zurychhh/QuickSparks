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
        KLUCZOWA KONFIGURACJA:
        basename ustawia podstawową ścieżkę dla wszystkich linków i routingów w aplikacji
        dzięki temu wszystkie strony będą dostępne pod /pdfspark/...
      */}
      <BrowserRouter basename="/pdfspark">
        <App />
      </BrowserRouter>
    </FeedbackProvider>
  </React.StrictMode>,
)