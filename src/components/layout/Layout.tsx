import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-20 lg:pt-20 pb-6 px-4 lg:px-6"
      >
        <div className="container mx-auto max-w-7xl">
          {children}
        </div>
      </motion.main>
    </div>
  );
};
