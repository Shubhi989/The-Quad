import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Zap, Target } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, Timestamp, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TeamJoinModal, JoinRequestData } from '@/components/teamfinder/TeamJoinModal';
import { findOrCreateChat, sendStructuredMessage, formatTeamJoinMessage } from '@/lib/chatUtils';

interface TeamPost {
  id: string;
  title: string;
  description: string;
  hackathonName: string;
  requiredSkills: string[];
  userId: string;
  userName?: string;
  createdAt?: Timestamp;
}

const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'UI/UX', 'Figma',
  'Machine Learning', 'Data Science', 'Mobile Dev', 'DevOps',
  'Backend', 'Frontend', 'Full Stack', 'Database'
];

const DEMO_POSTS: TeamPost[] = [
  { id: 'demo1', title: 'AI Innovators', description: 'Building an AI-powered study assistant. Need ML experts and frontend devs to join our team!', hackathonName: 'HackAI 2025', requiredSkills: ['Machine Learning', 'Python', 'React', 'TypeScript'], userId: 'demo', userName: 'Rahul S.' },
  { id: 'demo2', title: 'Green Tech Warriors', description: 'Working on sustainability tracking app. Looking for full-stack developers and UI/UX designers.', hackathonName: 'EcoHack', requiredSkills: ['Full Stack', 'UI/UX', 'Figma', 'Node.js'], userId: 'demo', userName: 'Priya M.' },
  { id: 'demo3', title: 'FinTech Builders', description: 'Creating a peer-to-peer payment solution for students. Need backend and security expertise.', hackathonName: 'FinHack 2025', requiredSkills: ['Backend', 'Database', 'Node.js', 'DevOps'], userId: 'demo', userName: 'Amit K.' },
  { id: 'demo4', title: 'Health Heroes', description: 'Building mental health support chatbot. Looking for NLP enthusiasts and mobile developers.', hackathonName: 'HealthTech Hack', requiredSkills: ['Machine Learning', 'Mobile Dev', 'Python', 'Data Science'], userId: 'demo', userName: 'Sneha R.' },
];

export default function TeamFinder() {
  const [posts, setPosts] = useState<TeamPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamPost | null>(null);
  const [joinedTeams, setJoinedTeams] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hackathonName: '',
    requiredSkills: [] as string[]
  });
  const { profile, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'teams'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          hackathonName: data.hackathonName || '',
          requiredSkills: data.requiredSkills || [],
          userId: data.userId || '',
          userName: data.userName,
          createdAt: data.createdAt
        };
      }) as TeamPost[];
      // Use demo data if Firestore is empty
      setPosts(postsData.length > 0 ? postsData : DEMO_POSTS);
    });
    return () => unsubscribe();
  }, []);

  const calculateMatch = (requiredSkills: string[]) => {
    const skills = requiredSkills || [];
    if (!profile?.skills?.length || !skills.length) return 0;
    const matches = skills.filter(skill => 
      profile.skills.some(s => s.toLowerCase() === skill.toLowerCase())
    );
    return Math.round((matches.length / skills.length) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      await addDoc(collection(db, 'teams'), {
        ...formData,
        userId: user.uid,
        userName: profile.name,
        createdAt: Timestamp.now()
      });
      toast({ title: 'Success', description: 'Team post created!' });
      setShowForm(false);
      setFormData({ title: '', description: '', hackathonName: '', requiredSkills: [] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    }
  };

  const handleJoinTeam = async (joinData: JoinRequestData) => {
    if (!user || !selectedTeam) {
      toast({ title: 'Login Required', description: 'Please login to join a team.', variant: 'destructive' });
      return;
    }

    // Don't allow joining demo teams
    if (selectedTeam.userId === 'demo') {
      toast({ title: 'Demo Team', description: 'This is a demo team. Create your own!', variant: 'destructive' });
      return;
    }

    try {
      // Store join request in subcollection: teams/{teamId}/joinRequests/{userId}
      const joinRequestRef = doc(db, 'teams', selectedTeam.id, 'joinRequests', user.uid);

      // Prevent duplicate requests
      const existingRequest = await getDoc(joinRequestRef);
      if (existingRequest.exists()) {
        toast({
          title: 'Already Requested',
          description: 'You have already requested to join this team.',
          variant: 'destructive',
        });
        return;
      }

      // TODO: Handle resume upload to storage if needed
      const resumeInfo = joinData.resumeFile 
        ? { resumeName: joinData.resumeFile.name }
        : {};

      // Create join request using setDoc with merge
      await setDoc(
        joinRequestRef,
        {
          userId: user.uid,
          fullName: joinData.fullName,
          email: joinData.email,
          skills: joinData.skills,
          role: joinData.role,
          bio: joinData.bio,
          ...resumeInfo,
          requestedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Find or create chat with team owner
      if (selectedTeam.userId && selectedTeam.userId !== user.uid) {
        try {
          const chatId = await findOrCreateChat(user.uid, selectedTeam.userId);
          
          // Format and send structured message
          const messageText = formatTeamJoinMessage(
            {
              fullName: joinData.fullName,
              email: joinData.email,
              skills: joinData.skills,
              role: joinData.role,
              bio: joinData.bio,
            },
            selectedTeam.title || 'Team'
          );

          // Get owner name
          let ownerName = selectedTeam.userName || 'Team Lead';
          try {
            const ownerDoc = await getDoc(doc(db, 'users', selectedTeam.userId));
            if (ownerDoc.exists()) {
              ownerName = ownerDoc.data().name || ownerName;
            }
          } catch {
            // Use default name
          }

          await sendStructuredMessage(chatId, {
            type: 'team_join_request',
            text: messageText,
            senderId: user.uid,
            receiverId: selectedTeam.userId,
            senderName: profile?.name || joinData.fullName,
            receiverName: ownerName,
            data: {
              teamId: selectedTeam.id,
              teamName: selectedTeam.title,
              hackathonName: selectedTeam.hackathonName,
              joinData: {
                fullName: joinData.fullName,
                email: joinData.email,
                skills: joinData.skills,
                role: joinData.role,
                bio: joinData.bio,
              }
            }
          });
        } catch (chatError) {
          console.error('Failed to send chat message:', chatError);
          // Don't fail the join request if chat fails
        }
      }

      // Update UI state
      setJoinedTeams(prev => new Set([...prev, selectedTeam.id]));

      toast({ title: 'Request Sent!', description: 'Your join request has been submitted.' });
    } catch (error) {
      console.error('Join error:', error);
      toast({ title: 'Error', description: 'Failed to submit request. Please try again.', variant: 'destructive' });
    }
  };

  const toggleSkill = (skill: string) => {
    if (formData.requiredSkills.includes(skill)) {
      setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter(s => s !== skill) });
    } else {
      setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, skill] });
    }
  };

  const handleOpenJoinModal = (team: TeamPost) => {
    setSelectedTeam(team);
    setShowJoinModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Team Finder</h1>
            <p className="text-muted-foreground">Find your perfect hackathon team</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Team Post
          </Button>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => {
              const requiredSkills = post.requiredSkills || [];
              const matchPercentage = calculateMatch(requiredSkills);
              const isOwner = post.userId === user?.uid;
              const hasRequested = joinedTeams.has(post.id);
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <GlowCard className="h-full">
                    <div className="p-6">
                      {/* Match indicator */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Team
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          <div className="relative w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${matchPercentage}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                            />
                          </div>
                          <span className="text-sm font-medium text-primary">{matchPercentage}%</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mb-1">{post.title || 'Untitled Team'}</h3>
                      <p className="text-sm text-primary mb-3">{post.hackathonName || 'Hackathon'}</p>
                      <p className="text-sm text-muted-foreground mb-4">{post.description || 'No description'}</p>

                      {/* Required Skills */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Looking for:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {requiredSkills.length > 0 ? requiredSkills.map((skill) => {
                            const hasSkill = profile?.skills?.some(s => s.toLowerCase() === skill.toLowerCase());
                            return (
                              <Badge 
                                key={skill}
                                variant={hasSkill ? 'default' : 'secondary'}
                                className={hasSkill ? 'bg-primary/20 text-primary border border-primary/30' : ''}
                              >
                                {hasSkill && <Zap className="w-3 h-3 mr-1" />}
                                {skill}
                              </Badge>
                            );
                          }) : (
                            <span className="text-xs text-muted-foreground">No specific skills listed</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">by {post.userName || 'Team Lead'}</span>
                        {isOwner ? (
                          <Badge variant="outline">Your Team</Badge>
                        ) : hasRequested ? (
                          <Button size="sm" disabled variant="secondary">
                            Requested
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleOpenJoinModal(post)}>
                            Join Team
                          </Button>
                        )}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No team posts yet. Be the first to create one!
          </div>
        )}

        {/* Create Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create Team Post</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Team Name"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Hackathon Name"
                    value={formData.hackathonName}
                    onChange={(e) => setFormData({ ...formData, hackathonName: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="What are you building? What kind of teammate are you looking for?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            formData.requiredSkills.includes(skill)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={formData.requiredSkills.length === 0}>
                    Create Post
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Modal */}
        <TeamJoinModal
          isOpen={showJoinModal}
          teamName={selectedTeam?.title || ''}
          hackathonName={selectedTeam?.hackathonName || ''}
          onClose={() => { setShowJoinModal(false); setSelectedTeam(null); }}
          onSubmit={handleJoinTeam}
        />
      </div>
    </Layout>
  );
}
