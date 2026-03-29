import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen flex bg-bg-base transition-colors duration-500">
      <Sidebar isExpanded={isSidebarExpanded} onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      <div 
        className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isSidebarExpanded ? "ml-[240px]" : "ml-[72px]"
        )}
      >
        <Header />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 overflow-auto"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
