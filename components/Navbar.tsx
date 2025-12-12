import React from 'react';
import { LogoIcon } from './Icons';
import { Button } from './Button';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isWorkspace = location.pathname.includes('workspace');

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-gray-900 group-hover:text-primary-600 transition-colors">
              <LogoIcon className="h-8 w-auto" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Super Content Factory</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-8">
            {!isWorkspace && (
              <>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Use Cases</a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!isWorkspace ? (
              <>
                 <Link to="/workspace" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    Login
                 </Link>
                 <Link to="/workspace">
                    <Button variant="primary" size="sm" className="bg-black hover:bg-gray-800 text-white rounded-full px-5">
                      Try Now
                    </Button>
                 </Link>
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};