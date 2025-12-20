import { motion } from 'framer-motion';
import { 
  Camera, Palette, Users, Mic, Code, MapPin, Calendar, 
  Clock, UserCheck, MoreVertical, Edit, Trash2, Lock, Unlock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CrewPost {
  id: string;
  clubName: string;
  title: string;
  description: string;
  role: string;
  eventName: string;
  eventDate: string;
  location?: string;
  skills: string[];
  deadline?: string;
  applicants: string[];
  userId: string;
  imageUrl?: string;
  status: 'open' | 'closed';
  createdAt?: any;
}

interface CrewCallCardProps {
  post: CrewPost;
  isOwner: boolean;
  hasApplied: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isLoggedIn: boolean;
  index: number;
}

export const ROLES = [
  { name: 'Photographer', icon: Camera, emoji: '📸' },
  { name: 'Designer', icon: Palette, emoji: '🎨' },
  { name: 'Volunteer', icon: Users, emoji: '🤝' },
  { name: 'Host/MC', icon: Mic, emoji: '🎤' },
  { name: 'Tech', icon: Code, emoji: '🧑‍💻' },
];

export const SKILLS = [
  'Photography', 'Video Editing', 'Graphic Design', 'UI/UX', 
  'Public Speaking', 'Event Management', 'Social Media', 
  'Web Development', 'Content Writing', 'Marketing'
];

export const getRoleIcon = (role: string) => {
  const found = ROLES.find(r => r.name.toLowerCase() === (role || '').toLowerCase());
  return found?.icon || Users;
};

export const getRoleEmoji = (role: string) => {
  const found = ROLES.find(r => r.name.toLowerCase() === (role || '').toLowerCase());
  return found?.emoji || '👥';
};

export const CrewCallCard = ({
  post,
  isOwner,
  hasApplied,
  onApply,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoggedIn,
  index
}: CrewCallCardProps) => {
  const RoleIcon = getRoleIcon(post.role);
  const applicantCount = post.applicants?.length || 0;
  const isClosed = post.status === 'closed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group"
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative rounded-2xl overflow-hidden h-full ${
          isClosed ? 'opacity-60' : ''
        }`}
      >
        {/* Glassmorphism Card */}
        <div className="relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-5px_hsl(199_89%_48%_/_0.3)]">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Image Section */}
          {post.imageUrl && (
            <div className="relative h-36 overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="relative p-5 space-y-4">
            {/* Header with Role Icon & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center flex-shrink-0"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <span className="text-xl">{getRoleEmoji(post.role)}</span>
                </motion.div>
                <div className="min-w-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs mb-1 ${
                      isClosed 
                        ? 'border-destructive/50 text-destructive' 
                        : 'border-primary/50 text-primary'
                    }`}
                  >
                    {isClosed ? 'Closed' : post.role || 'Role'}
                  </Badge>
                  <h3 className="font-semibold text-foreground truncate">{post.title || 'Untitled'}</h3>
                </div>
              </div>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleStatus}>
                      {isClosed ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      {isClosed ? 'Re-open' : 'Close'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Club Name */}
            <p className="text-sm text-primary font-medium">{post.clubName || 'Organization'}</p>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">{post.description || ''}</p>

            {/* Skills Tags */}
            {post.skills && post.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.skills.slice(0, 3).map((skill, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-xs bg-secondary/50 border border-primary/20 text-muted-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
                {post.skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-secondary/50">
                    +{post.skills.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {post.eventDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.eventDate}
                </span>
              )}
              {post.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {post.location}
                </span>
              )}
              {post.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Apply by {post.deadline}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserCheck className="w-4 h-4" />
                <span>{applicantCount} applied</span>
              </div>
              
              {!isOwner && (
                <>
                  {!isLoggedIn ? (
                    <Button size="sm" variant="outline" disabled>
                      Login to Apply
                    </Button>
                  ) : isClosed ? (
                    <Button size="sm" variant="outline" disabled>
                      Closed
                    </Button>
                  ) : hasApplied ? (
                    <Button size="sm" variant="outline" disabled className="border-primary/50 text-primary">
                      Applied ✓
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={onApply}
                      className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                    >
                      Apply Now
                    </Button>
                  )}
                </>
              )}
              
              {isOwner && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  Your Post
                </Badge>
              )}
            </div>
          </div>

          {/* Glow Effect on Hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px -20px hsl(199 89% 48% / 0.1)'
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
