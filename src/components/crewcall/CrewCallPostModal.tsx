import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ROLES, SKILLS, CrewPost } from './CrewCallCard';

interface CrewCallPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CrewPost>) => Promise<void>;
  editPost?: CrewPost | null;
}

const compressImage = (file: File, maxWidth = 600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const CrewCallPostModal = ({ isOpen, onClose, onSubmit, editPost }: CrewCallPostModalProps) => {
  const [formData, setFormData] = useState({
    title: editPost?.title || '',
    clubName: editPost?.clubName || '',
    description: editPost?.description || '',
    role: editPost?.role || '',
    skills: editPost?.skills || [] as string[],
    eventName: editPost?.eventName || '',
    eventDate: editPost?.eventDate || '',
    location: editPost?.location || '',
    deadline: editPost?.deadline || '',
    imageUrl: editPost?.imageUrl || ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(editPost?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    
    try {
      setIsUploading(true);
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setFormData({ ...formData, imageUrl: compressed });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clubName || !formData.role) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {editPost ? 'Edit Crew Call' : 'Post a Crew Call'}
                </h2>
                <p className="text-sm text-muted-foreground">Find the perfect crew for your event</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Title */}
              <div className="space-y-2">
                <Label>Role Title *</Label>
                <Input
                  placeholder="e.g., Event Photographer Needed"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              {/* Club/Organization */}
              <div className="space-y-2">
                <Label>Club / Organization *</Label>
                <Input
                  placeholder="Your club or organization name"
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  required
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              {/* Role Category */}
              <div className="space-y-2">
                <Label>Role Category *</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(({ name, emoji }) => (
                    <Badge
                      key={name}
                      variant={formData.role === name ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all py-1.5 px-3 ${
                        formData.role === name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary/10 hover:border-primary/50'
                      }`}
                      onClick={() => setFormData({ ...formData, role: name })}
                    >
                      {emoji} {name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills Required */}
              <div className="space-y-2">
                <Label>Skills Required</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs transition-all ${
                        formData.skills.includes(skill)
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

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/30 border-border/50 min-h-[100px]"
                />
              </div>

              {/* Event Details Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    placeholder="Event name"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
              </div>

              {/* Location & Deadline Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Campus location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Event Image (Optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, imageUrl: '' });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed border-border/50 hover:border-primary/50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {isUploading ? 'Processing...' : 'Upload Image'}
                  </Button>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                disabled={isSubmitting || !formData.title || !formData.clubName || !formData.role}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Posting...' : editPost ? 'Save Changes' : 'Post Crew Call'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
