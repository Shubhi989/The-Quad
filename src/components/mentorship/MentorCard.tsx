import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MentorCardProps {
  mentor: {
    id: string;
    name: string;
    year: string;
    department: string;
    expertise: string[];
    available: boolean;
    bio?: string;
  };
  index: number;
  onClick: () => void;
}

export const MentorCard = ({ mentor, index, onClick }: MentorCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-2xl opacity-0 group-hover:opacity-75 blur-sm transition-all duration-300" />
      
      <div className="relative bg-card border border-border/50 rounded-2xl p-6 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_hsl(199_89%_48%_/_0.2)]">
        {/* Gradient background shift on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              {mentor.available && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {mentor.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mentor.year} • {mentor.department}
              </p>
            </div>
            <Badge 
              variant={mentor.available ? "default" : "secondary"}
              className={mentor.available 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : "bg-muted text-muted-foreground"
              }
            >
              {mentor.available ? 'Available' : 'Fully Booked'}
            </Badge>
          </div>

          {/* Expertise chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {mentor.expertise.slice(0, 4).map((skill) => (
              <motion.span
                key={skill}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 
                  group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_10px_hsl(199_89%_48%_/_0.3)]
                  transition-all duration-300"
              >
                {skill}
              </motion.span>
            ))}
            {mentor.expertise.length > 4 && (
              <span className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                +{mentor.expertise.length - 4} more
              </span>
            )}
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 
              text-primary-foreground font-medium group-hover:shadow-[0_0_20px_hsl(199_89%_48%_/_0.4)] transition-all"
            disabled={!mentor.available}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Request Guidance
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
