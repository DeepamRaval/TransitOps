import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { SideCommunication } from './SideCommunication';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <Sidebar />
      <main className="flex-1 ml-64 max-lg:ml-[72px] p-6 lg:p-8 transition-all duration-300 relative">
        <TopBar />
        {children}
      </main>
      <SideCommunication isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
