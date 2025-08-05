import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🎉 MultiApps Project
        </h1>
        <p className="text-gray-600 mb-6">
          React + TypeScript + Tailwind CSS BERHASIL!
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;