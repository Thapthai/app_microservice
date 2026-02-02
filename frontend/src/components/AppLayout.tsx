'use client';

import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: ReactNode;
  /** ใช้ความกว้างเต็ม (ไม่มี max-width) เหมาะกับ Dashboard */
  fullWidth?: boolean;
}

export default function AppLayout({ children, fullWidth }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main Content - ขยายตามขนาด Sidebar */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <Navbar />
        
        <main className="flex-1 overflow-y-auto">
          <div
            className={
              fullWidth
                ? 'w-full max-w-full px-4 sm:px-6 lg:px-8 py-6'
                : 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
