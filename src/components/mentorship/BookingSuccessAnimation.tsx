import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface BookingSuccessAnimationProps {
  show: boolean;
  onComplete: () => void;
}

// Constellation checkmark points (normalized 0-1)
const CHECKMARK_POINTS = [
  { x: 0.25, y: 0.5 },
  { x: 0.45, y: 0.7 },
  { x: 0.75, y: 0.3 },
];

export const BookingSuccessAnimation = ({ show, onComplete }: BookingSuccessAnimationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<'scatter' | 'converge' | 'complete'>('scatter');

  useEffect(() => {
    if (show) {
      // Create particles scattered across screen
      const newParticles: Particle[] = [];
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      for (let i = 0; i < 50; i++) {
        const checkmarkIndex = i % CHECKMARK_POINTS.length;
        const point = CHECKMARK_POINTS[checkmarkIndex];
        
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          targetX: centerX + (point.x - 0.5) * 200,
          targetY: centerY + (point.y - 0.5) * 200,
        });
      }
      setParticles(newParticles);
      setPhase('scatter');

      // Start convergence after scatter
      setTimeout(() => setPhase('converge'), 500);
      
      // Complete and return
      setTimeout(() => {
        setPhase('complete');
        setTimeout(onComplete, 500);
      }, 2500);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-lg"
      >
        {/* Particles */}
        {particles.map((particle, index) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.x, 
              y: particle.y,
              scale: 0,
              opacity: 0 
            }}
            animate={phase === 'converge' || phase === 'complete' ? {
              x: particle.targetX,
              y: particle.targetY,
              scale: phase === 'complete' ? 1.5 : 1,
              opacity: 1,
            } : {
              x: particle.x,
              y: particle.y,
              scale: 1,
              opacity: 1,
            }}
            transition={{
              duration: phase === 'converge' ? 1.2 : 0.3,
              delay: index * 0.02,
              ease: 'easeInOut',
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsl(${199 + Math.random() * 20} 89% ${48 + Math.random() * 20}%)`,
              boxShadow: '0 0 10px hsl(199 89% 48% / 0.8)',
            }}
          />
        ))}

        {/* Checkmark SVG overlay */}
        <motion.svg
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: phase === 'complete' ? 1 : 0, 
            scale: phase === 'complete' ? 1 : 0.5 
          }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute w-48 h-48"
          viewBox="0 0 100 100"
        >
          <motion.path
            d="M 25 50 L 45 70 L 75 30"
            fill="none"
            stroke="hsl(199 89% 48%)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase === 'complete' ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 20px hsl(199 89% 48%))',
            }}
          />
        </motion.svg>

        {/* Success Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: phase === 'complete' ? 1 : 0, 
            y: phase === 'complete' ? 0 : 30 
          }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute mt-48 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Mentorship Booked Successfully
          </h2>
          <p className="text-muted-foreground">
            Your session has been confirmed
          </p>
        </motion.div>

        {/* Radial glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: phase === 'complete' ? 2 : 0, 
            opacity: phase === 'complete' ? 0.3 : 0 
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute w-64 h-64 rounded-full bg-primary/30 blur-3xl"
        />
      </motion.div>
    </AnimatePresence>
  );
};
