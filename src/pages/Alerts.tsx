import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, X, AlertTriangle, Calendar, Clock, Megaphone, Users, Sparkles } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'deadline' | 'announcement' | 'urgent' | 'recruitment';
  date?: string;
  userId: string;
  userName?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

// Format date as "Today", "Tomorrow", or "Dec 25"
const formatEventDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Format timestamp as relative time
const formatTimestamp = (ts: { seconds: number; nanoseconds: number } | string | null | undefined): string => {
  if (!ts) return 'Recently';
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'object' && 'seconds' in ts && typeof ts.seconds === 'number') {
    try {
      const date = new Date(ts.seconds * 1000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  }
  return 'Recently';
};

const getDateString = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (typeof date === 'object' && 'seconds' in date) {
    try {
      return new Date(date.seconds * 1000).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  return '';
};

const ALERT_TYPES = [
  { type: 'event', label: 'Event', icon: Calendar, color: 'from-blue-500 to-cyan-500', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500' },
  { type: 'deadline', label: 'Deadline', icon: Clock, color: 'from-orange-500 to-amber-500', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500' },
  { type: 'announcement', label: 'Announcement', icon: Megaphone, color: 'from-purple-500 to-pink-500', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500' },
  { type: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'from-red-500 to-rose-500', bgClass: 'bg-red-500/10', textClass: 'text-red-500' },
  { type: 'recruitment', label: 'Recruitment', icon: Users, color: 'from-green-500 to-emerald-500', bgClass: 'bg-green-500/10', textClass: 'text-green-500' }
];

const DEMO_ALERTS: Alert[] = [
  { id: 'demo1', title: 'Hackathon Registration Open', description: 'Register now for CodeStorm 2025! Early bird deadline ends Jan 10th. Limited spots available. Cash prizes worth ₹50,000!', type: 'event', date: '2025-01-15', userId: 'demo', userName: 'Tech Club', createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } },
  { id: 'demo2', title: 'DSA Assignment 3 Extended', description: 'DSA Assignment 3 deadline extended to next Monday. Topics: Trees, Graphs, Dynamic Programming. Submit via portal only.', type: 'deadline', date: '2025-01-13', userId: 'demo', userName: 'Prof. Kumar', createdAt: { seconds: Date.now() / 1000 - 7200, nanoseconds: 0 } },
  { id: 'demo3', title: 'Campus WiFi Maintenance', description: 'Campus WiFi will be down for maintenance on Saturday 6AM-10AM. Mobile data recommended. Plan accordingly.', type: 'announcement', userId: 'demo', userName: 'IT Department', createdAt: { seconds: Date.now() / 1000 - 14400, nanoseconds: 0 } },
  { id: 'demo4', title: 'Emergency: Water Supply Disruption', description: 'Water supply to Hostels A, B, C will be disrupted today 2PM-6PM due to pipeline repair. Store water in advance.', type: 'urgent', date: new Date().toISOString().split('T')[0], userId: 'demo', userName: 'Hostel Admin', createdAt: { seconds: Date.now() / 1000 - 1800, nanoseconds: 0 } },
  { id: 'demo5', title: 'Career Fair - Top Tech Companies', description: 'Google, Microsoft, Amazon, and 20+ companies visiting campus. Update your resume and register on placement portal!', type: 'event', date: '2025-01-18', userId: 'demo', userName: 'Placement Cell', createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 } },
  { id: 'demo6', title: 'Photography Club Recruitment', description: 'Looking for creative photographers to join our team! Open to all years. Bring your portfolio to the interview.', type: 'recruitment', userId: 'demo', userName: 'Photography Club', createdAt: { seconds: Date.now() / 1000 - 43200, nanoseconds: 0 } },
  { id: 'demo7', title: 'Last Date: Scholarship Applications', description: 'Merit scholarship applications close on Jan 20th. Minimum 8.5 CGPA required. Apply through student portal with documents.', type: 'deadline', date: '2025-01-20', userId: 'demo', userName: 'Academic Office', createdAt: { seconds: Date.now() / 1000 - 172800, nanoseconds: 0 } },
  { id: 'demo8', title: 'Sports Day Registration', description: 'Annual Sports Day on Feb 5th. Events: Athletics, Cricket, Football, Badminton, Chess. Register with your department sports rep.', type: 'event', date: '2025-02-05', userId: 'demo', userName: 'Sports Committee', createdAt: { seconds: Date.now() / 1000 - 259200, nanoseconds: 0 } },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'announcement' as Alert['type'],
    date: ''
  });
  const { profile, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '',
        description: doc.data().description || '',
        type: doc.data().type || 'announcement',
        date: getDateString(doc.data().date),
        userId: doc.data().userId || '',
        userName: doc.data().userName,
        createdAt: doc.data().createdAt
      })) as Alert[];
      setAlerts(alertsData.length > 0 ? alertsData : DEMO_ALERTS);
    }, (error) => {
      console.error('Error fetching alerts:', error);
      setAlerts(DEMO_ALERTS);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({ title: 'Error', description: 'Please login to post alerts', variant: 'destructive' });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'alerts'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        date: formData.date || null,
        userId: user.uid,
        userName: profile.name || 'Anonymous',
        createdAt: Timestamp.now()
      });
      toast({ title: 'Success', description: 'Alert posted successfully!' });
      setShowForm(false);
      setFormData({ title: '', description: '', type: 'announcement', date: '' });
    } catch (error) {
      console.error('Error posting alert:', error);
      toast({ title: 'Error', description: 'Failed to post alert. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const getAlertConfig = (type: string) => {
    return ALERT_TYPES.find(t => t.type === type) || ALERT_TYPES[2];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="w-8 h-8 text-primary" />
              Campus Alerts
            </h1>
            <p className="text-muted-foreground mt-1">Stay updated with events, deadlines & announcements</p>
          </div>
          {user && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Post Alert
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap p-1 bg-secondary/50 rounded-xl w-fit">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-lg"
          >
            All
          </Button>
          {ALERT_TYPES.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(type)}
              className="rounded-lg gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert, index) => {
              const config = getAlertConfig(alert.type);
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <GlowCard className={cn(
                    'overflow-hidden transition-all duration-200 hover:shadow-lg',
                    alert.type === 'urgent' && 'border-red-500/30 bg-red-500/5'
                  )}>
                    <div className="flex">
                      <div className={`w-1.5 bg-gradient-to-b ${config.color}`} />
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            config.bgClass
                          )}>
                            <Icon className={cn('w-5 h-5', config.textClass)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                                  <Badge 
                                    variant="outline" 
                                    className={cn('text-xs capitalize border-0', config.bgClass, config.textClass)}
                                  >
                                    {alert.type}
                                  </Badge>
                                  {alert.type === 'urgent' && (
                                    <span className="flex items-center gap-1 text-xs text-red-500 animate-pulse">
                                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                                      Urgent
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {alert.description}
                                </p>
                              </div>
                              {alert.date && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap shrink-0">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatEventDate(alert.date)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
                                  {(alert.userName || 'A')[0].toUpperCase()}
                                </span>
                                {alert.userName || 'Campus Admin'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(alert.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-card/50 border border-border/50 rounded-2xl"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Alerts Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {filter === 'all' 
                ? "There are no campus alerts at the moment. Check back later!"
                : `No ${filter} alerts found. Try a different category.`}
            </p>
            {user && (
              <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
                <Plus className="w-4 h-4" /> Be the first to post
              </Button>
            )}
          </motion.div>
        )}

        {/* Post Alert Modal */}
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
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Post Alert</h2>
                    <p className="text-sm text-muted-foreground">Share with your campus community</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Alert Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALERT_TYPES.map(({ type, label, icon: Icon, bgClass, textClass }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type as Alert['type'] })}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border',
                            formData.type === type
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      placeholder="What's happening?"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      placeholder="Share more details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 min-h-[100px]"
                      required
                      maxLength={500}
                    />
                  </div>
                  {(formData.type === 'event' || formData.type === 'deadline' || formData.type === 'recruitment') && (
                    <div>
                      <label className="text-sm font-medium">Date (optional)</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="mt-1"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Posting...' : 'Post Alert'}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
