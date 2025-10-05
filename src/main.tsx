import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadCriticalComponents } from './utils/preload'

// Preload critical components after initial render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Preload critical components for better performance
preloadCriticalComponents();