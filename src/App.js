import React from 'react';

function App() {
  return React.createElement('div', { style: { padding: '20px', backgroundColor: 'lightblue' } }, 
    React.createElement('h1', null, 'Hello World!'),
    React.createElement('p', null, 'This is a simple test to see if React is working.')
  );
}

export default App;


