import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Scope compositor workarounds to the native Android app, not browsers.
if (/Android/i.test(navigator.userAgent) && /; wv\)|Capacitor|Version\/\d.*Chrome/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('android-webview');
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
