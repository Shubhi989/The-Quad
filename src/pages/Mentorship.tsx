import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, X, Sparkles } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { MentorCard } from '@/components/mentorship/MentorCard';
import { MentorDetailModal } from '@/components/mentorship/MentorDetailModal';
import { BookingSuccessAnimation } from '@/components/mentorship/BookingSuccessAnimation';
import { MentorshipTimeline, TimelineItem } from '@/components/mentorship/MentorshipTimeline';
import { EmptyMentorState } from '@/components/mentorship/EmptyMentorState';
import { MySessions } from '@/components/mentorship/MySessions';
import { SeniorRequestsDashboard } from '@/components/mentorship/SeniorRequestsDashboard';

interface MentorSlot {
  id: string;
  mentorId: string;
  mentorName: string;
  expertise: string[];
  topic: string;
  description: string;
  date: string;
  time: string;
  status: 'available' | 'booked' | 'completed';
  bookedBy?: string;
  bookedByName?: string;
  year?: string;
  department?: string;
  bio?: string;
  createdAt?: Timestamp;
}

interface Mentor {
  id: string;
  name: string;
  year: string;
  department: string;
  expertise: string[];
  available: boolean;
  bio?: string;
}

const EXPERTISE_AREAS = [
  'Internships', 'DSA', 'Hackathons', 'Placements', 'Research',
  'Resume Review', 'Interview Prep', 'Project Help'
];

// Demo mentors for visual richness
const DEMO_MENTORS: Mentor[] = [
  { id: 'demo1', name: 'Arjun Mehta', year: '4th Year', department: 'Computer Science', expertise: ['DSA', 'Placements', 'Interview Prep'], available: true, bio: 'Hey! I\'ve cracked Google & Amazon internships. Happy to help you prep for interviews and placements!' },
  { id: 'demo2', name: 'Priya Sharma', year: '3rd Year', department: 'Electronics', expertise: ['Research', 'Hackathons', 'Project Help'], available: true, bio: 'Research enthusiast with 2 papers published. Let\'s discuss your research ideas!' },
  { id: 'demo3', name: 'Vikram Singh', year: '4th Year', department: 'Information Technology', expertise: ['Internships', 'Resume Review', 'Hackathons'], available: true, bio: 'Ex-Microsoft intern. I can help you build an impressive portfolio!' },
  { id: 'demo4', name: 'Neha Gupta', year: '3rd Year', department: 'Computer Science', expertise: ['DSA', 'Interview Prep', 'Placements'], available: false, bio: 'Competitive programmer with 5-star rating on CodeChef.' },
  { id: 'demo5', name: 'Rahul Verma', year: '4th Year', department: 'Mechanical', expertise: ['Research', 'Project Help'], available: true, bio: 'Working on robotics research. Can guide you through academic research methodology.' },
];


export default function Mentorship() {
  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>(DEMO_MENTORS);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    expertise: [] as string[],
    date: '',
    time: '',
    year: '',
    department: ''
  });
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const isSenior = profile?.role === 'mentor' || profile?.role === 'club';

  useEffect(() => {
    const q = query(collection(db, 'mentorship_requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slotsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          mentorId: data.mentorId || '',
          mentorName: data.mentorName || '',
          expertise: data.expertise || [],
          topic: data.topic || '',
          description: data.description || '',
          date: typeof data.date === 'string' ? data.date : '',
          time: data.time || '',
          status: data.status || 'available',
          bookedBy: data.bookedBy,
          bookedByName: data.bookedByName,
          year: data.year,
          department: data.department,
          bio: data.bio,
          createdAt: data.createdAt
        };
      }) as MentorSlot[];
      setSlots(slotsData);

      // Convert slots to mentor format and merge with demo mentors
      const slotsAsMentors: Mentor[] = slotsData
        .filter(s => s.status === 'available')
        .map(s => ({
          id: s.id,
          name: s.mentorName,
          year: s.year || '3rd Year',
          department: s.department || 'Computer Science',
          expertise: s.expertise,
          available: s.status === 'available',
          bio: s.bio || s.description
        }));

      // Use Firebase data if available, otherwise use demo
      if (slotsAsMentors.length > 0) {
        setMentors(slotsAsMentors);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      await addDoc(collection(db, 'mentorship_requests'), {
        ...formData,
        mentorId: user.uid,
        mentorName: profile.name,
        status: 'available',
        createdAt: Timestamp.now()
      });
      toast({ title: 'Success', description: 'You are now available as a mentor!' });
      setShowForm(false);
      setFormData({ topic: '', description: '', expertise: [], date: '', time: '', year: '', department: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create mentor profile', variant: 'destructive' });
    }
  };

  const handleBook = async (mentorId: string, duration: number, slot: string) => {
    if (!user || !profile) return;
    
    setSelectedMentor(null);
    setShowSuccess(true);

    // If it's a real Firebase slot, update it
    const realSlot = slots.find(s => s.id === mentorId);
    if (realSlot && !mentorId.startsWith('demo')) {
      try {
        await updateDoc(doc(db, 'mentorship_requests', mentorId), {
          status: 'booked',
          bookedBy: user.uid,
          bookedByName: profile.name,
          bookedDuration: duration,
          bookedSlot: slot
        });
      } catch (error) {
        console.error('Error booking session:', error);
      }
    }
  };

  const toggleExpertise = (area: string) => {
    if (formData.expertise.includes(area)) {
      setFormData({ ...formData, expertise: formData.expertise.filter(a => a !== area) });
    } else {
      setFormData({ ...formData, expertise: [...formData.expertise, area] });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Booking Success Animation */}
        <BookingSuccessAnimation 
          show={showSuccess} 
          onComplete={() => setShowSuccess(false)} 
        />

        {/* Mentor Detail Modal */}
        <MentorDetailModal 
          mentor={selectedMentor} 
          onClose={() => setSelectedMentor(null)}
          onBook={handleBook}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
                Mentorship
              </span>
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground">Connect with seniors who've been there</p>
          </div>
          {isSenior && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-[0_0_20px_hsl(199_89%_48%_/_0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Become a Mentor
            </Button>
          )}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="browse" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Browse Mentors
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Sessions
            </TabsTrigger>
            {isSenior && (
              <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Requests
              </TabsTrigger>
            )}
          </TabsList>

          {/* Browse Mentors Tab */}
          <TabsContent value="browse" className="mt-6">
            {mentors.length > 0 ? (
              <MentorshipTimeline>
                {mentors.map((mentor, index) => (
                  <TimelineItem key={mentor.id} index={index}>
                    <MentorCard 
                      mentor={mentor} 
                      index={index}
                      onClick={() => mentor.available && setSelectedMentor(mentor)}
                    />
                  </TimelineItem>
                ))}
              </MentorshipTimeline>
            ) : (
              <EmptyMentorState />
            )}
          </TabsContent>

          {/* My Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            <MySessions userId={user?.uid || ''} userRole={isSenior ? 'senior' : 'student'} />
          </TabsContent>

          {/* Senior Requests Tab */}
          {isSenior && (
            <TabsContent value="requests" className="mt-6">
              <SeniorRequestsDashboard mentorId={user?.uid || ''} />
            </TabsContent>
          )}
        </Tabs>

        {/* Create Mentor Profile Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div 
                initial={{ backdropFilter: 'blur(0px)' }}
                animate={{ backdropFilter: 'blur(12px)' }}
                className="absolute inset-0 bg-background/60"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-2xl opacity-50 blur-sm" />
                <div className="relative bg-card border border-primary/30 rounded-2xl p-6 shadow-[0_0_40px_hsl(199_89%_48%_/_0.2)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold">Become a Mentor</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Year (e.g., 3rd Year)"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      placeholder="What can you help with? (Topic)"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Share a bit about yourself and your experience..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="min-h-[100px]"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Areas of Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {EXPERTISE_AREAS.map((area) => (
                          <motion.button
                            key={area}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleExpertise(area)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              formData.expertise.includes(area)
                                ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(199_89%_48%_/_0.4)]'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {area}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 h-12 text-base shadow-[0_0_20px_hsl(199_89%_48%_/_0.3)]"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Mentoring
                    </Button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
