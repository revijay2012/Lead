import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

console.log('main.js starting...');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);
console.log('App:', App);

try {
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    console.log('React root created');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App)
      )
    );
    console.log('App rendered successfully');
  } else {
    console.error('Root element not found!');
  }
} catch (error) {
  console.error('Error in main.js:', error);
}
