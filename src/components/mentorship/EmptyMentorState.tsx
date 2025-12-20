import { motion } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';

export const EmptyMentorState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Floating illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-8"
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 40px hsl(199 89% 48% / 0.2)',
              '0 0 60px hsl(199 89% 48% / 0.4)',
              '0 0 40px hsl(199 89% 48% / 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
          <Users className="w-16 h-16 text-primary/60" />
          
          {/* Orbiting sparkles */}
          <motion.div
            className="absolute w-full h-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-5 text-primary" />
          </motion.div>
          <motion.div
            className="absolute w-full h-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2 text-center"
      >
        No mentors available right now
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md"
      >
        Check back soon — our senior mentors are getting ready to help you succeed!
      </motion.p>
    </motion.div>
  );
};
