import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Design system — app-wide design tokens and component styles
import './css/design-system.css';
import './css/components.css';
import './css/layout.css';
import './css/animations.css';
import './css/agentflow.css';
import './css/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
