import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MessageSquare, CheckCircle, Clock3, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Session {
  id: string;
  mentorName: string;
  studentName?: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed';
}

interface MySessionsProps {
  userId: string;
  userRole: 'student' | 'senior';
}

const statusConfig = {
  pending: { 
    icon: Clock3, 
    label: 'Pending', 
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
  },
  confirmed: { 
    icon: CheckCircle, 
    label: 'Confirmed', 
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
  },
  completed: { 
    icon: CheckCircle, 
    label: 'Completed', 
    className: 'bg-primary/20 text-primary border-primary/30' 
  },
  booked: { 
    icon: CheckCircle, 
    label: 'Booked', 
    className: 'bg-primary/20 text-primary border-primary/30' 
  },
};

export const MySessions = ({ userId, userRole }: MySessionsProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Query sessions where user is either the booker or the mentor
    const q = query(
      collection(db, 'mentorship_requests'),
      or(
        where('bookedBy', '==', userId),
        where('mentorId', '==', userId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: Session[] = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Only show booked/confirmed/completed sessions, not available slots
          if (data.status === 'available') return false;
          // For students, show sessions they booked
          // For seniors, show sessions where they are the mentor
          if (userRole === 'student') {
            return data.bookedBy === userId;
          } else {
            return data.mentorId === userId && data.status !== 'available';
          }
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            mentorName: data.mentorName || 'Unknown Mentor',
            studentName: data.bookedByName || 'Unknown Student',
            topic: data.topic || data.bookedSlot || 'Mentorship Session',
            date: data.date || 'TBD',
            time: data.time || data.bookedSlot || 'TBD',
            duration: data.bookedDuration || 30,
            status: data.status === 'booked' ? 'confirmed' : (data.status || 'pending')
          };
        });
      
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole]);

  const upcomingSessions = sessions.filter(s => s.status !== 'completed');
  const pastSessions = sessions.filter(s => s.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Sessions
        </h3>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => {
              const statusKey = session.status as keyof typeof statusConfig;
              const config = statusConfig[statusKey] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-[0_0_20px_hsl(199_89%_48%_/_0.1)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{session.topic}</h4>
                      <p className="text-sm text-muted-foreground">
                        {userRole === 'student' ? `with ${session.mentorName}` : `with ${session.studentName}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.time}
                        </span>
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={config.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4">No upcoming sessions</p>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-muted-foreground" />
          Past Sessions
        </h3>
        {pastSessions.length > 0 ? (
          <div className="space-y-3">
            {pastSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card/50 border border-border/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{session.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      {userRole === 'student' ? `with ${session.mentorName}` : `with ${session.studentName}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.date} • {session.duration} min
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Leave Feedback
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4">No past sessions yet</p>
        )}
      </div>
    </div>
  );
};
