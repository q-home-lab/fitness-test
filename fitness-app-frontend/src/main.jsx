import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' 
import StoreInitializer from './components/StoreInitializer'
import { registerServiceWorker } from './utils/registerServiceWorker'
import { useWebVitals } from './hooks/useWebVitals'

// Componente wrapper para Web Vitals
const WebVitalsTracker = () => {
  useWebVitals();
  return null;
};

// Registrar Service Worker para PWA
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
      <WebVitalsTracker />
      <StoreInitializer>
        <App />
      </StoreInitializer>
    </BrowserRouter>
  </StrictMode>,
)
