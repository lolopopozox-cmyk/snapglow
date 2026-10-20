import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Defensive: ensure the progressive-enhancement flag exists even if the
// inline <head> script was stripped (reveal CSS depends on `html.js`).
document.documentElement.classList.add('js');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
