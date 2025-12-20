import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SKILLS, CrewPost } from './CrewCallCard';

export interface ApplicationData {
  fullName: string;
  email: string;
  skills: string[];
  experience: string;
  message: string;
  resumeFile?: File;
}

interface CrewCallApplyModalProps {
  isOpen: boolean;
  post: CrewPost | null;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => Promise<void>;
}

export const CrewCallApplyModal = ({ isOpen, post, onClose, onSubmit }: CrewCallApplyModalProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setExperience('');
    setMessage('');
    setSelectedSkills([]);
    setResumeFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName,
        email,
        skills: selectedSkills,
        experience,
        message,
        resumeFile: resumeFile || undefined,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Apply for Role</h2>
                <p className="text-sm text-primary">{post.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Post Info */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-foreground">{post.clubName}</p>
              <p className="text-xs text-muted-foreground mt-1">{post.eventName} • {post.eventDate || 'TBA'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills You Bring *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs transition-all ${
                        selectedSkills.includes(skill)
                          ? 'bg-primary/80 text-primary-foreground'
                          : 'hover:bg-primary/10 text-muted-foreground'
                      }`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label>Relevant Experience</Label>
                <Textarea
                  placeholder="Briefly describe your relevant experience..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="bg-secondary/30 border-border/50 min-h-[80px]"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Why are you a good fit? *</Label>
                <Textarea
                  placeholder="Tell them about your enthusiasm, or why you want to be part of this..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="bg-secondary/30 border-border/50 min-h-[80px]"
                />
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label>Resume (PDF)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 p-3 bg-secondary/30 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                      {resumeFile ? (
                        <>
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground truncate">{resumeFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload PDF resume</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {resumeFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setResumeFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                disabled={isSubmitting || !fullName || !email || !message || selectedSkills.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
