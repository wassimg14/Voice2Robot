import React, { useEffect, useRef, useState } from 'react';

function App() {
  useEffect(() => {
    // Redirect to the actual app
    window.location.href = '/index.html';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl">Loading Voice-to-Robot Control...</p>
      </div>
    </div>
  );
}

export default App;