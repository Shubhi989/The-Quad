import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Users, Megaphone, MessageCircle, User, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlowCard } from '@/components/ui/GlowCard';

interface Application {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  skills: string[];
  experience?: string;
  message: string;
  appliedAt: Date;
  crewCallId: string;
  crewCallTitle?: string;
}

interface JoinRequest {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  skills: string[];
  role: string;
  bio: string;
  requestedAt: Date;
  teamId: string;
  teamName?: string;
}

interface OwnerInboxProps {
  className?: string;
}

export function OwnerInbox({ className }: OwnerInboxProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load crew call applications for posts owned by user
  useEffect(() => {
    if (!user) return;

    // First, get all crew calls owned by this user
    const crewCallsQuery = query(
      collection(db, 'crewCalls'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(crewCallsQuery, async (crewCallsSnapshot) => {
      const allApplications: Application[] = [];

      for (const crewCallDoc of crewCallsSnapshot.docs) {
        const crewCallData = crewCallDoc.data();
        const crewCallId = crewCallDoc.id;
        const crewCallTitle = crewCallData.title;

        // Listen to applications subcollection for each crew call
        const applicationsRef = collection(db, 'crewCalls', crewCallId, 'applications');
        const applicationsSnapshot = await new Promise<any>((resolve) => {
          const unsub = onSnapshot(applicationsRef, (snap) => {
            unsub();
            resolve(snap);
          });
        });

        applicationsSnapshot.docs.forEach((appDoc: any) => {
          const appData = appDoc.data();
          allApplications.push({
            id: appDoc.id,
            userId: appData.userId,
            fullName: appData.fullName || appData.userName || 'Unknown',
            email: appData.email || appData.userEmail || '',
            skills: appData.skills || [],
            experience: appData.experience,
            message: appData.message || '',
            appliedAt: appData.appliedAt?.toDate() || new Date(),
            crewCallId,
            crewCallTitle,
          });
        });
      }

      setApplications(allApplications.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load team join requests for teams owned by user
  useEffect(() => {
    if (!user) return;

    const teamsQuery = query(
      collection(db, 'teams'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(teamsQuery, async (teamsSnapshot) => {
      const allRequests: JoinRequest[] = [];

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        const teamId = teamDoc.id;
        const teamName = teamData.title;

        // Listen to joinRequests subcollection for each team
        const requestsRef = collection(db, 'teams', teamId, 'joinRequests');
        const requestsSnapshot = await new Promise<any>((resolve) => {
          const unsub = onSnapshot(requestsRef, (snap) => {
            unsub();
            resolve(snap);
          });
        });

        requestsSnapshot.docs.forEach((reqDoc: any) => {
          const reqData = reqDoc.data();
          allRequests.push({
            id: reqDoc.id,
            userId: reqData.userId,
            fullName: reqData.fullName || 'Unknown',
            email: reqData.email || '',
            skills: reqData.skills || [],
            role: reqData.role || '',
            bio: reqData.bio || '',
            requestedAt: reqData.requestedAt?.toDate() || new Date(),
            teamId,
            teamName,
          });
        });
      }

      setJoinRequests(allRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()));
    });

    return () => unsubscribe();
  }, [user]);

  const openChatWithUser = (userId: string, userName: string) => {
    navigate(`/messages?chat=${userId}&name=${encodeURIComponent(userName)}`);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!user) return null;

  const totalCount = applications.length + joinRequests.length;

  if (totalCount === 0 && !loading) return null;

  return (
    <div className={className}>
      <GlowCard>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Inbox className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Owner Inbox</h3>
            {totalCount > 0 && (
              <Badge variant="default" className="ml-auto">
                {totalCount} new
              </Badge>
            )}
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="applications" className="flex items-center gap-1">
                <Megaphone className="w-3 h-3" />
                Crew ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="joinRequests" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Teams ({joinRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
              ) : (
                <AnimatePresence>
                  {applications.slice(0, 5).map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => openChatWithUser(app.userId, app.fullName)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{app.fullName}</span>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(app.appliedAt)}</span>
                          </div>
                          <p className="text-xs text-primary truncate">{app.crewCallTitle}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-[10px] px-1 py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="joinRequests" className="space-y-2">
              {joinRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No join requests yet</p>
              ) : (
                <AnimatePresence>
                  {joinRequests.slice(0, 5).map((req, index) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => openChatWithUser(req.userId, req.fullName)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{req.fullName}</span>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(req.requestedAt)}</span>
                          </div>
                          <p className="text-xs text-primary truncate">{req.teamName} • {req.role}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-[10px] px-1 py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>

          {totalCount > 5 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-primary"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              View all in Messages
            </Button>
          )}
        </div>
      </GlowCard>
    </div>
  );
}
