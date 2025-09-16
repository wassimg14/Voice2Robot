import React from 'react';

function App() {
  // Redirect to the actual application
  React.useEffect(() => {
    window.location.href = '/index.html';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Loading Voice-to-Robot Control...</p>
      </div>
    </div>
  );
}

export default App;
