import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Github, Linkedin, ArrowLeft, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'club';
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  photoURL?: string;
}

export default function UserProfileView() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          // Show a placeholder profile if user not found
          setProfile({
            uid: userId,
            name: 'Campus Member',
            email: 'member@college.edu',
            role: 'student',
            skills: []
          });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, toast]);

  const handleSendMessage = () => {
    if (!user) {
      toast({ title: 'Info', description: 'Please log in to send messages' });
      return;
    }
    if (userId === user.uid) {
      toast({ title: 'Info', description: "You can't message yourself" });
      return;
    }
    // Navigate to messages page with the chat open
    navigate(`/messages?chat=${userId}&name=${encodeURIComponent(profile?.name || 'User')}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="h-32 bg-gradient-to-br from-primary/30 via-primary/20 to-transparent relative">
            <motion.div
              className="absolute -bottom-12 left-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
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
                <h1 className="text-2xl font-bold">{profile?.name || 'Unknown User'}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile?.email || 'No email'}</span>
                </div>
              </div>
              <Button onClick={handleSendMessage}>
                <MessageCircle className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </div>

            {/* Role */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Role</label>
              <Badge variant="secondary" className="capitalize">{profile?.role || 'student'}</Badge>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.length ? (
                  profile.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-secondary">{skill}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No skills listed</span>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </label>
                {profile?.githubUrl ? (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                    {profile.githubUrl}
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">Not set</span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </label>
                {profile?.linkedinUrl ? (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                    {profile.linkedinUrl}
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">Not set</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
