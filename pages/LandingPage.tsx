import React from 'react';
import { Button } from '../components/Button';
import { ArrowRightIcon, BrainIcon, SparklesIcon, LayoutIcon, SaveIcon, FileTextIcon, DeviceIcon, LogoIcon } from '../components/Icons';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ title: string; desc: string; icon: React.ReactNode }> = ({ title, desc, icon }) => (
  <div className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 mb-5 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
              
              {/* Left Column: Copy */}
              <div className="lg:col-span-6 text-left z-10">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                  Your second brain for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500">
                    Creativity & Logic.
                  </span>
                </h1>
                <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
                  Seamlessly combine reading, thinking, and writing. The AI-first workspace designed to turn information into insight.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/workspace">
                    <Button size="lg" className="w-full sm:w-auto gap-2 group rounded-full px-8 py-4 text-base">
                      Start Free Trial
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 py-4 text-base">
                    View Demo Workspace
                  </Button>
                </div>
              </div>

              {/* Right Column: Visual Mockup (Left List + Right Content) */}
              <div className="lg:col-span-6 mt-16 lg:mt-0 relative">
                {/* Decorative background effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60 -z-10"></div>
                
                {/* Main Window Frame */}
                <div className="relative rounded-xl bg-white border border-gray-200 shadow-2xl overflow-hidden aspect-[16/10] flex flex-col">
                  {/* Window Controls */}
                  <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  
                  {/* App Body */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/4 bg-gray-50 border-r border-gray-100 p-3 flex flex-col gap-3">
                      <div className="h-2 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-6 w-full bg-white border border-gray-100 rounded shadow-sm"></div>
                        <div className="h-6 w-full bg-transparent rounded px-2 flex items-center"><div className="w-full h-1.5 bg-gray-200 rounded-full"></div></div>
                        <div className="h-6 w-full bg-transparent rounded px-2 flex items-center"><div className="w-3/4 h-1.5 bg-gray-200 rounded-full"></div></div>
                        <div className="h-6 w-full bg-transparent rounded px-2 flex items-center"><div className="w-5/6 h-1.5 bg-gray-200 rounded-full"></div></div>
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="w-3/4 p-6 bg-white flex flex-col relative">
                       {/* Header */}
                       <div className="mb-6">
                         <div className="h-6 w-1/3 bg-gray-800 rounded mb-2"></div>
                         <div className="h-3 w-1/5 bg-gray-300 rounded"></div>
                       </div>
                       
                       {/* Text Content */}
                       <div className="space-y-3 mb-6">
                         <div className="h-2 w-full bg-gray-100 rounded"></div>
                         <div className="h-2 w-full bg-gray-100 rounded"></div>
                         <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                         <div className="h-2 w-full bg-gray-100 rounded"></div>
                       </div>

                       {/* AI Block */}
                       <div className="mt-auto mb-4 bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-3">
                          <div className="w-6 h-6 rounded bg-blue-100 flex-shrink-0"></div>
                          <div className="flex-1 space-y-1.5 py-1">
                             <div className="h-2 w-full bg-blue-200/50 rounded"></div>
                             <div className="h-2 w-4/5 bg-blue-200/50 rounded"></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                One place for Learning, Thinking, and Creating.
              </h2>
              <p className="text-lg text-gray-500">
                Stop switching between ten different apps. Manage your entire knowledge workflow in a single, fluid interface.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                title="Save Everything" 
                desc="One-click save for articles, PDFs, and videos. Keep your inspiration in one library."
                icon={<SaveIcon />}
              />
              <FeatureCard 
                title="AI Summary" 
                desc="Instantly summarize long content and auto-highlight key insights for you."
                icon={<SparklesIcon />}
              />
              <FeatureCard 
                title="Notes to Draft" 
                desc="Drag your notes into the editor and let AI help you weave them into a draft."
                icon={<FileTextIcon />}
              />
              <FeatureCard 
                title="Cross-Device" 
                desc="Start on your phone, continue on your laptop. Your mind, synced everywhere."
                icon={<DeviceIcon />}
              />
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-gray-400">
               {/* Small Logo for footer */}
               <LogoIcon className="h-6 w-auto" />
            </div>
            <span className="text-sm text-gray-500">© 2024 Super Content Factory. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Help Center</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};