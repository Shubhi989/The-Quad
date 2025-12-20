import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Megaphone } from 'lucide-react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  addDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CrewCallCard, CrewPost } from '@/components/crewcall/CrewCallCard';
import { CrewCallFilters } from '@/components/crewcall/CrewCallFilters';
import { CrewCallPostModal } from '@/components/crewcall/CrewCallPostModal';
import { CrewCallApplyModal, ApplicationData } from '@/components/crewcall/CrewCallApplyModal';
import { CrewCallEmptyState } from '@/components/crewcall/CrewCallEmptyState';

const CREW_CALLS_COLLECTION = 'crewCalls';

export default function CrewCall() {
  const [posts, setPosts] = useState<CrewPost[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CrewPost | null>(null);
  const [editPost, setEditPost] = useState<CrewPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [appliedPosts, setAppliedPosts] = useState<Set<string>>(new Set());
  const { profile, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, CREW_CALLS_COLLECTION));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        skills: docSnap.data().skills || [],
        applicants: docSnap.data().applicants || [],
        status: docSnap.data().status || 'open',
      })) as CrewPost[];
      setPosts(postsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.clubName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || post.role === selectedRole;
    const matchesStatus = !selectedStatus || post.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSubmitPost = async (data: Partial<CrewPost>) => {
    if (!user) return;
    try {
      if (editPost) {
        await updateDoc(doc(db, CREW_CALLS_COLLECTION, editPost.id), { ...data });
        toast({ title: 'Updated!', description: 'Crew call updated successfully.' });
      } else {
        const docRef = doc(collection(db, CREW_CALLS_COLLECTION));
        await setDoc(docRef, {
          ...data,
          applicants: [],
          userId: user.uid,
          status: 'open',
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Posted!', description: 'Your crew call is now live.' });
      }
      setEditPost(null);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    }
  };

  const handleApply = async (applicationData: ApplicationData) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to apply.', variant: 'destructive' });
      return;
    }
    if (!selectedPost) return;

    try {
      // 1) Always re-fetch the crew call to get the authoritative ownerId
      const crewRef = doc(db, CREW_CALLS_COLLECTION, selectedPost.id);
      const crewSnap = await getDoc(crewRef);
      if (!crewSnap.exists()) {
        toast({ title: 'Error', description: 'Crew call not found.', variant: 'destructive' });
        return;
      }

      const crewData = crewSnap.data() as { userId?: string; title?: string };
      const ownerId = crewData.userId;
      const crewTitle = crewData.title || selectedPost.title || 'Crew Call';

      if (!ownerId) {
        toast({ title: 'Error', description: 'Crew call owner not found.', variant: 'destructive' });
        return;
      }

      // Prevent duplicate applications per user (but still keep the final save after message send)
      const applicationRef = doc(db, CREW_CALLS_COLLECTION, selectedPost.id, 'applications', user.uid);
      const existingApplication = await getDoc(applicationRef);
      if (existingApplication.exists()) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied to this crew call.',
          variant: 'destructive',
        });
        return;
      }

      // 2) Find existing chat where participants contains both users (order-independent)
      let chatId: string | null = null;
      const chatsRef = collection(db, 'chats');
      const myChatsQuery = query(chatsRef, where('participants', 'array-contains', user.uid));
      const myChatsSnap = await getDocs(myChatsQuery);
      for (const chatDoc of myChatsSnap.docs) {
        const data = chatDoc.data() as { participants?: string[] };
        const participants = data.participants || [];
        if (participants.length === 2 && participants.includes(user.uid) && participants.includes(ownerId)) {
          chatId = chatDoc.id;
          break;
        }
      }

      // 3) If chat doesn't exist, create it with autoId
      if (!chatId) {
        const newChatRef = await addDoc(chatsRef, {
          participants: [user.uid, ownerId],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
        });
        chatId = newChatRef.id;
      }

      // 4) Send structured message
      const resumeUrl = undefined as string | undefined;
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        type: 'crew_application',
        text: 'New Crew Call Application',
        metadata: {
          crewId: selectedPost.id,
          crewTitle,
          name: applicationData.fullName,
          skills: applicationData.skills,
          experience: applicationData.experience,
          message: applicationData.message,
          resumeUrl: resumeUrl ?? null,
          email: applicationData.email,
        },
        createdAt: serverTimestamp(),
        chatId,
      });

      // 5) Update chat document
      await setDoc(
        doc(db, 'chats', chatId),
        {
          lastMessage: 'New Crew Call Application',
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 6) ONLY after message is sent: save application
      const resumeInfo = applicationData.resumeFile ? { resumeName: applicationData.resumeFile.name } : {};
      await setDoc(
        applicationRef,
        {
          userId: user.uid,
          fullName: applicationData.fullName,
          email: applicationData.email,
          skills: applicationData.skills,
          experience: applicationData.experience,
          message: applicationData.message,
          ...resumeInfo,
          resumeUrl: resumeUrl ?? null,
          appliedAt: serverTimestamp(),
          chatId,
          messageId: messageRef.id,
        },
        { merge: true }
      );

      // 7) Update UI
      setAppliedPosts((prev) => new Set([...prev, selectedPost.id]));
      toast({ title: 'Applied!', description: 'Your application has been submitted successfully.' });
    } catch (error) {
      console.error('Apply error:', error);
      toast({ title: 'Error', description: 'Failed to submit application. Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, CREW_CALLS_COLLECTION, postId));
      toast({ title: 'Deleted', description: 'Crew call removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (post: CrewPost) => {
    try {
      await updateDoc(doc(db, CREW_CALLS_COLLECTION, post.id), {
        status: post.status === 'open' ? 'closed' : 'open'
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
            >
              <Megaphone className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crew Call</h1>
              <p className="text-muted-foreground">Find opportunities & build your crew</p>
            </div>
          </div>
          {user && (
            <Button onClick={() => { setEditPost(null); setShowPostModal(true); }} className="bg-gradient-to-r from-primary to-cyan-500">
              <Plus className="w-4 h-4 mr-2" /> Post Crew Call
            </Button>
          )}
        </div>

        {/* Filters */}
        <CrewCallFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => (
                <CrewCallCard
                  key={post.id}
                  post={post}
                  index={index}
                  isOwner={post.userId === user?.uid}
                  hasApplied={post.applicants?.includes(user?.uid || '') || appliedPosts.has(post.id)}
                  isLoggedIn={!!user}
                  onApply={() => { setSelectedPost(post); setShowApplyModal(true); }}
                  onEdit={() => { setEditPost(post); setShowPostModal(true); }}
                  onDelete={() => handleDelete(post.id)}
                  onToggleStatus={() => handleToggleStatus(post)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <CrewCallEmptyState />
        )}

        {/* Modals */}
        <CrewCallPostModal
          isOpen={showPostModal}
          onClose={() => { setShowPostModal(false); setEditPost(null); }}
          onSubmit={handleSubmitPost}
          editPost={editPost}
        />
        <CrewCallApplyModal
          isOpen={showApplyModal}
          post={selectedPost}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApply}
        />
      </div>
    </Layout>
  );
}
