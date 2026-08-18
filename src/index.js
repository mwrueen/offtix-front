import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress findDOMNode deprecation warning triggered by third-party libraries (e.g., react-quill) in React 18 StrictMode
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
    return;
  }
  originalError.apply(console, args);
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

