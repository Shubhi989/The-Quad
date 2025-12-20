import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Calendar, Clock, Check, X, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Request {
  id: string;
  studentName: string;
  studentId: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'accepted' | 'declined' | 'booked' | 'confirmed';
}

interface SeniorRequestsDashboardProps {
  mentorId: string;
}

export const SeniorRequestsDashboard = ({ mentorId }: SeniorRequestsDashboardProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!mentorId) {
      setLoading(false);
      return;
    }

    // Query all mentorship requests where this user is the mentor and someone has booked
    const q = query(
      collection(db, 'mentorship_requests'),
      where('mentorId', '==', mentorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: Request[] = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Only show requests that have been booked (not available slots)
          return data.bookedBy && data.status !== 'available';
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            studentName: data.bookedByName || 'Unknown Student',
            studentId: data.bookedBy || '',
            topic: data.topic || 'Mentorship Session',
            date: data.date || 'TBD',
            time: data.time || data.bookedSlot || 'TBD',
            duration: data.bookedDuration || 30,
            status: data.status === 'booked' ? 'pending' : (data.status || 'pending')
          };
        });
      
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mentorId]);

  const handleAccept = async (id: string) => {
    try {
      await updateDoc(doc(db, 'mentorship_requests', id), {
        status: 'confirmed'
      });
      toast({ title: 'Request Accepted', description: 'The student has been notified.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await updateDoc(doc(db, 'mentorship_requests', id), {
        status: 'declined',
        bookedBy: null,
        bookedByName: null
      });
      toast({ title: 'Request Declined', description: 'The slot is now available again.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'booked');
  const handledRequests = requests.filter(r => r.status === 'accepted' || r.status === 'declined' || r.status === 'confirmed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="relative">
            <span className="w-2 h-2 rounded-full bg-yellow-500 absolute -left-4 top-1/2 transform -translate-y-1/2 animate-pulse" />
          </span>
          Incoming Requests
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </h3>
        
        <AnimatePresence mode="popLayout">
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{request.studentName}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{request.topic}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {request.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {request.time}
                        </span>
                        <span>{request.duration} min</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(request.id)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm py-4 text-center bg-card/50 rounded-xl border border-border/30"
            >
              No pending requests — you're all caught up!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Handled Requests */}
      {handledRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Responses</h3>
          <div className="space-y-2">
            {handledRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card/30 border border-border/30 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <UserCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{request.studentName}</p>
                    <p className="text-xs text-muted-foreground">{request.topic}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={request.status === 'accepted' || request.status === 'confirmed'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-destructive/20 text-destructive border-destructive/30'
                  }
                >
                  {request.status === 'accepted' || request.status === 'confirmed' ? 'Accepted' : 'Declined'}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
