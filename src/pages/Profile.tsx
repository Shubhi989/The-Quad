import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Github, Linkedin, Save, Plus, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'UI/UX', 'Figma',
  'Machine Learning', 'Data Science', 'Mobile Dev', 'DevOps',
  'Photography', 'Video Editing', 'Graphic Design', 'Content Writing'
];

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [role, setRole] = useState<'student' | 'mentor' | 'club'>(profile?.role || 'student');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name, role, skills, githubUrl, linkedinUrl });
    toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
    setEditing(false);
    setSaving(false);
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="h-32 bg-gradient-to-br from-primary/30 via-primary/20 to-transparent relative">
            <motion.div
              className="absolute -bottom-12 left-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
            </motion.div>
          </div>

          <div className="pt-16 px-6 pb-6">
            {/* Name & Role */}
            <div className="flex items-start justify-between mb-6">
              <div>
                {editing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xl font-bold bg-secondary mb-2"
                    placeholder="Your Name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{profile?.name}</h1>
                )}
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile?.email}</span>
                </div>
              </div>
              <Button
                variant={editing ? 'default' : 'outline'}
                onClick={editing ? handleSave : () => setEditing(true)}
                disabled={saving}
              >
                {editing ? <><Save className="w-4 h-4 mr-2" /> Save</> : 'Edit Profile'}
              </Button>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Role</label>
              {editing ? (
                <div className="flex gap-2">
                  {(['student', 'mentor', 'club'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        role === r 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : (
                <Badge variant="secondary" className="capitalize">{profile?.role}</Badge>
              )}
            </div>

            {/* Skills */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">Skills</label>
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  AVAILABLE_SKILLS.map((skill) => (
                    <motion.button
                      key={skill}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        skills.includes(skill)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {skills.includes(skill) && <X className="w-3 h-3 inline mr-1" />}
                      {skill}
                    </motion.button>
                  ))
                ) : (
                  profile?.skills?.length ? (
                    profile.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="bg-secondary">{skill}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No skills added yet</span>
                  )
                )}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </label>
                {editing ? (
                  <Input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="bg-secondary"
                  />
                ) : (
                  profile?.githubUrl ? (
                    <a href={profile.githubUrl} target="_blank" rel="noopener" className="text-primary hover:underline text-sm">
                      {profile.githubUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not set</span>
                  )
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </label>
                {editing ? (
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="bg-secondary"
                  />
                ) : (
                  profile?.linkedinUrl ? (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener" className="text-primary hover:underline text-sm">
                      {profile.linkedinUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not set</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
