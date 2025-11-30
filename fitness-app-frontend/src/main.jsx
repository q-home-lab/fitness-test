import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' 
import StoreInitializer from './components/StoreInitializer'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Registrar Service Worker para PWA
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
      <StoreInitializer>
        <App />
      </StoreInitializer>
    </BrowserRouter>
  </StrictMode>,
)
