import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

export const FlipCard = ({ front, back, className }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn('flip-card cursor-pointer', className)}
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: '1500px' }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          rotateX: isHovered && !isFlipped ? -5 : 0,
          scale: isHovered ? 1.02 : 1
        }}
        transition={{ 
          duration: 0.6, 
          type: 'spring', 
          stiffness: 80,
          damping: 15
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div 
          className="absolute inset-0 rounded-xl bg-card border border-border/50 p-6 overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
          whileHover={{ boxShadow: '0 20px 40px -20px hsl(199 89% 48% / 0.3)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
          {front}
        </motion.div>
        <motion.div 
          className="absolute inset-0 rounded-xl bg-card border border-primary/50 p-6 overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          {back}
        </motion.div>
      </motion.div>
    </div>
  );
};
