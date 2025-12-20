import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Clock, Calendar, Sparkles, BookOpen, Briefcase, Code, Trophy, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MentorDetailModalProps {
  mentor: {
    id: string;
    name: string;
    year: string;
    department: string;
    expertise: string[];
    available: boolean;
    bio?: string;
  } | null;
  onClose: () => void;
  onBook: (mentorId: string, duration: number, slot: string) => void;
}

const TOPICS = [
  { icon: Briefcase, label: 'Internships', color: 'text-blue-400' },
  { icon: Code, label: 'DSA', color: 'text-green-400' },
  { icon: Trophy, label: 'Hackathons', color: 'text-yellow-400' },
  { icon: BookOpen, label: 'Placements', color: 'text-purple-400' },
  { icon: FlaskConical, label: 'Research', color: 'text-pink-400' },
];

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const DURATIONS = [15, 30, 45];

export const MentorDetailModal = ({ mentor, onClose, onBook }: MentorDetailModalProps) => {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (!mentor) return null;

  const handleBook = () => {
    if (selectedSlot) {
      onBook(mentor.id, selectedDuration, selectedSlot);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop with glassmorphism */}
        <motion.div 
          initial={{ backdropFilter: 'blur(0px)' }}
          animate={{ backdropFilter: 'blur(12px)' }}
          exit={{ backdropFilter: 'blur(0px)' }}
          className="absolute inset-0 bg-background/60"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-2xl opacity-50 blur-sm" />
          
          <div className="relative bg-card border border-primary/30 rounded-2xl p-6 shadow-[0_0_40px_hsl(199_89%_48%_/_0.2)]">
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{mentor.name}</h2>
                <p className="text-muted-foreground">{mentor.year} • {mentor.department}</p>
                <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Available
                </Badge>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
              <p className="text-foreground">
                {mentor.bio || `Hey! I'm ${mentor.name.split(' ')[0]}, a ${mentor.year.toLowerCase()} student passionate about helping juniors navigate their academic journey. Feel free to reach out for guidance!`}
              </p>
            </div>

            {/* Topics */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Topics I Can Help With</h3>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(({ icon: Icon, label, color }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Available Slots
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <motion.button
                    key={slot}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedSlot === slot
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(199_89%_48%_/_0.4)]'
                        : 'bg-secondary/50 hover:bg-secondary text-foreground'
                    }`}
                  >
                    {slot}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Session Duration
              </h3>
              <div className="flex gap-2">
                {DURATIONS.map((duration) => (
                  <motion.button
                    key={duration}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDuration(duration)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      selectedDuration === duration
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(199_89%_48%_/_0.4)]'
                        : 'bg-secondary/50 hover:bg-secondary text-foreground'
                    }`}
                  >
                    {duration} min
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Book Button */}
            <Button 
              className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 
                text-primary-foreground font-medium h-12 text-base shadow-[0_0_20px_hsl(199_89%_48%_/_0.3)]
                hover:shadow-[0_0_30px_hsl(199_89%_48%_/_0.5)] transition-all"
              onClick={handleBook}
              disabled={!selectedSlot}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Book Session
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
