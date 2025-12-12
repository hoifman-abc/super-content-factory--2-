import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;