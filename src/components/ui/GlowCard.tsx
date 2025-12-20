import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverScale?: number;
  delay?: number;
}

export const GlowCard = ({ 
  children, 
  className, 
  onClick, 
  hoverScale = 1.02,
  delay = 0 
}: GlowCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100 }}
      whileHover={{ 
        scale: hoverScale,
        rotateY: 1,
        rotateX: 1,
        boxShadow: '0 20px 40px -20px hsl(199 89% 48% / 0.4), 0 0 30px hsl(199 89% 48% / 0.2)'
      }}
      whileTap={{ scale: 0.98, rotateX: 2 }}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-card border border-border/50',
        'transition-all duration-300 cursor-pointer',
        'hover:border-primary/50',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  );
};
