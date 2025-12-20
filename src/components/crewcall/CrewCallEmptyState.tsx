import { motion } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';

export const CrewCallEmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Floating Illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
          <Users className="w-16 h-16 text-primary/50" />
        </div>
        
        {/* Sparkle Effects */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-6 h-6 text-primary" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-1 -left-3"
        >
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground mb-2">No Crew Calls Yet</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        No opportunities available right now — check back soon or be the first to post!
      </p>

      {/* Pulse Ring Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [0.8, 1.5], opacity: [0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-64 h-64 rounded-full border border-primary/20"
        />
      </div>
    </motion.div>
  );
};
