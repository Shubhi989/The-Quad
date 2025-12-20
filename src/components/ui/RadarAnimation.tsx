import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RadarAnimationProps {
  className?: string;
  size?: number;
  items?: { x: number; y: number; label: string }[];
}

export const RadarAnimation = ({ className, size = 200, items = [] }: RadarAnimationProps) => {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      {/* Radar circles */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute inset-0 rounded-full border border-primary/20"
          style={{
            transform: `scale(${ring * 0.33})`,
            transformOrigin: 'center'
          }}
        />
      ))}
      
      {/* Radar sweep */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div 
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
          style={{
            background: 'linear-gradient(90deg, hsl(199 89% 48% / 0.8), transparent)'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-1/2 origin-left"
          style={{
            height: size / 2,
            marginTop: -size / 4,
            background: 'conic-gradient(from 0deg, hsl(199 89% 48% / 0.2), transparent 60deg)'
          }}
        />
      </motion.div>

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_hsl(199_89%_48%_/_0.8)]" />

      {/* Items on radar */}
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="absolute w-2 h-2 rounded-full bg-accent-foreground shadow-[0_0_8px_hsl(199_89%_48%_/_0.6)]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          style={{
            left: `${50 + item.x * 40}%`,
            top: `${50 + item.y * 40}%`,
            transform: 'translate(-50%, -50%)'
          }}
          title={item.label}
        />
      ))}
    </div>
  );
};
