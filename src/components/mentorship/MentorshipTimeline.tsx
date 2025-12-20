import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MentorshipTimelineProps {
  children: ReactNode;
}

export const MentorshipTimeline = ({ children }: MentorshipTimelineProps) => {
  return (
    <div className="relative">
      {/* Timeline line with pulsing glow */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 transform md:-translate-x-1/2">
        <motion.div
          className="w-full h-full rounded-full"
          style={{
            background: 'linear-gradient(to bottom, hsl(199 89% 48% / 0.1), hsl(199 89% 48% / 0.6), hsl(187 85% 53% / 0.6), hsl(199 89% 48% / 0.1))',
          }}
          animate={{
            boxShadow: [
              '0 0 10px hsl(199 89% 48% / 0.3)',
              '0 0 20px hsl(199 89% 48% / 0.6)',
              '0 0 10px hsl(199 89% 48% / 0.3)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Animated energy pulse traveling down the line */}
        <motion.div
          className="absolute left-0 w-full h-20 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, hsl(199 89% 60% / 0.8), transparent)',
          }}
          animate={{
            top: ['-20%', '120%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Children (mentor cards) */}
      <div className="relative z-10 space-y-8 pl-16 md:pl-0">
        {children}
      </div>
    </div>
  );
};

interface TimelineItemProps {
  children: ReactNode;
  index: number;
}

export const TimelineItem = ({ children, index }: TimelineItemProps) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      {/* Timeline dot */}
      <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 z-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
          className="relative"
        >
          <div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-[0_0_15px_hsl(199_89%_48%_/_0.6)]" />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/50"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          />
        </motion.div>
      </div>

      {/* Card container */}
      <div className={`w-full md:w-[calc(50%-2rem)] ${isEven ? 'md:pr-8' : 'md:pl-8'}`}>
        {children}
      </div>

      {/* Spacer for opposite side */}
      <div className="hidden md:block w-1/2" />
    </div>
  );
};
