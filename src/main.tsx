import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initCapacitorPlugins } from './utils/capacitorInit';

// Initialize Capacitor native plugins when running on Android or iOS
initCapacitorPlugins();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

