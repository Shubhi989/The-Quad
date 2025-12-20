import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Megaphone, 
  GraduationCap, 
  Bell,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { useAuth } from '@/hooks/useAuth';
import { OwnerInbox } from '@/components/inbox/OwnerInbox';

interface RecentActivity {
  id: string;
  text: string;
  time: string;
  type: 'team' | 'found' | 'crew' | 'alert' | 'mentor';
}

const formatTimeAgo = (timestamp: Timestamp | string | Date | null): string => {
  if (!timestamp) return 'Recently';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Recently';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const modules = [
  {
    title: 'Lost & Found',
    description: 'Report or find lost items on campus',
    icon: Search,
    path: '/lost-found',
    color: 'from-blue-500 to-cyan-500',
    statsKey: 'lostFound'
  },
  {
    title: 'Team Finder',
    description: 'Find teammates for hackathons',
    icon: Users,
    path: '/team-slot',
    color: 'from-purple-500 to-pink-500',
    statsKey: 'teams'
  },
  {
    title: 'Crew Call',
    description: 'Join club activities and events',
    icon: Megaphone,
    path: '/crew-call',
    color: 'from-orange-500 to-red-500',
    statsKey: 'crewCalls'
  },
  {
    title: 'Mentorship',
    description: 'Connect with senior mentors',
    icon: GraduationCap,
    path: '/mentorship',
    color: 'from-green-500 to-emerald-500',
    statsKey: 'mentors'
  },
  {
    title: 'Alerts',
    description: 'Campus events and deadlines',
    icon: Bell,
    path: '/alerts',
    color: 'from-yellow-500 to-orange-500',
    statsKey: 'alerts'
  }
];

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    lostFound: 0,
    teams: 0,
    mentors: 0,
    alerts: 0,
    crewCalls: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Real-time listeners for document counts
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Lost items count
    const lostItemsQuery = query(collection(db, 'lost_items'));
    unsubscribers.push(
      onSnapshot(lostItemsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, lostFound: snapshot.size }));
      })
    );

    // Teams count
    const teamsQuery = query(collection(db, 'teams'));
    unsubscribers.push(
      onSnapshot(teamsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, teams: snapshot.size }));
      })
    );

    // Mentorship requests count (available mentors)
    const mentorsQuery = query(collection(db, 'mentorship_requests'));
    unsubscribers.push(
      onSnapshot(mentorsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, mentors: snapshot.size }));
      })
    );

    // Alerts count
    const alertsQuery = query(collection(db, 'alerts'));
    unsubscribers.push(
      onSnapshot(alertsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, alerts: snapshot.size }));
      })
    );

    // Crew calls count
    const crewCallsQuery = query(collection(db, 'crewCalls'));
    unsubscribers.push(
      onSnapshot(crewCallsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, crewCalls: snapshot.size }));
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Real-time listener for recent activity (combined from multiple collections)
  useEffect(() => {
    const activities: RecentActivity[] = [];
    const unsubscribers: (() => void)[] = [];

    const updateActivities = () => {
      // Sort by most recent and take top 5
      const sorted = [...activities].sort((a, b) => {
        const timeA = a.time.includes('Just now') ? 0 : parseInt(a.time) || 999;
        const timeB = b.time.includes('Just now') ? 0 : parseInt(b.time) || 999;
        return timeA - timeB;
      });
      setRecentActivity(sorted.slice(0, 5));
    };

    // Lost items activity
    const lostItemsQuery = query(collection(db, 'lost_items'), limit(5));
    unsubscribers.push(
      onSnapshot(lostItemsQuery, (snapshot) => {
        const lostActivities = snapshot.docs.map(doc => ({
          id: `lost-${doc.id}`,
          text: `${doc.data().type === 'found' ? 'Found' : 'Lost'}: ${doc.data().item_name || 'Unknown item'} near ${doc.data().location || 'campus'}`,
          time: formatTimeAgo(doc.data().createdAt),
          type: 'found' as const
        }));
        // Remove old lost activities and add new ones
        const filtered = activities.filter(a => !a.id.startsWith('lost-'));
        activities.length = 0;
        activities.push(...filtered, ...lostActivities);
        updateActivities();
      })
    );

    // Teams activity
    const teamsQuery = query(collection(db, 'teams'), limit(5));
    unsubscribers.push(
      onSnapshot(teamsQuery, (snapshot) => {
        const teamActivities = snapshot.docs.map(doc => ({
          id: `team-${doc.id}`,
          text: `New team looking for ${doc.data().lookingFor || doc.data().skills?.join(', ') || 'members'}: ${doc.data().projectName || doc.data().name || 'Hackathon project'}`,
          time: formatTimeAgo(doc.data().createdAt),
          type: 'team' as const
        }));
        const filtered = activities.filter(a => !a.id.startsWith('team-'));
        activities.length = 0;
        activities.push(...filtered, ...teamActivities);
        updateActivities();
      })
    );

    // Crew calls activity
    const crewQuery = query(collection(db, 'crewCalls'), limit(5));
    unsubscribers.push(
      onSnapshot(crewQuery, (snapshot) => {
        const crewActivities = snapshot.docs.map(doc => ({
          id: `crew-${doc.id}`,
          text: `${doc.data().clubName || 'Club'} needs volunteers for ${doc.data().eventName || doc.data().title || 'event'}`,
          time: formatTimeAgo(doc.data().createdAt || doc.data().eventDate),
          type: 'crew' as const
        }));
        const filtered = activities.filter(a => !a.id.startsWith('crew-'));
        activities.length = 0;
        activities.push(...filtered, ...crewActivities);
        updateActivities();
      })
    );

    // Alerts activity
    const alertsQuery = query(collection(db, 'alerts'), limit(5));
    unsubscribers.push(
      onSnapshot(alertsQuery, (snapshot) => {
        const alertActivities = snapshot.docs.map(doc => ({
          id: `alert-${doc.id}`,
          text: doc.data().title || doc.data().message || 'New campus alert',
          time: formatTimeAgo(doc.data().createdAt || doc.data().date),
          type: 'alert' as const
        }));
        const filtered = activities.filter(a => !a.id.startsWith('alert-'));
        activities.length = 0;
        activities.push(...filtered, ...alertActivities);
        updateActivities();
      })
    );

    // Mentors activity
    const mentorsQuery = query(collection(db, 'mentorship_requests'), limit(5));
    unsubscribers.push(
      onSnapshot(mentorsQuery, (snapshot) => {
        const mentorActivities = snapshot.docs.map(doc => ({
          id: `mentor-${doc.id}`,
          text: `${doc.data().mentorName || 'Mentor'} available for ${doc.data().topic || doc.data().expertise?.join(', ') || 'mentorship'}`,
          time: formatTimeAgo(doc.data().createdAt),
          type: 'mentor' as const
        }));
        const filtered = activities.filter(a => !a.id.startsWith('mentor-'));
        activities.length = 0;
        activities.push(...filtered, ...mentorActivities);
        updateActivities();
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const getStatsForModule = (statsKey: string) => {
    const count = stats[statsKey as keyof typeof stats] || 0;
    return count > 0 ? `${count} active` : 'No data';
  };

  const quickStats = [
    { label: 'Active Posts', value: stats.lostFound.toString(), trend: 'Lost & Found' },
    { label: 'Team Requests', value: stats.teams.toString(), trend: 'Looking for members' },
    { label: 'Mentor Sessions', value: stats.mentors.toString(), trend: 'Available mentors' },
    { label: 'Alerts', value: stats.alerts.toString(), trend: 'Campus updates' }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, <span className="text-gradient">{profile?.name || 'Student'}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening on campus today
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="w-4 h-4 text-primary" />
              <span>Live updates</span>
            </div>
          </div>
        </motion.div>

        {/* Owner Inbox */}
        <OwnerInbox className="mb-6" />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card border border-border/50 rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-lg hover:border-primary/30"
            >
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-primary flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Module Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Link key={module.path} to={module.path}>
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <GlowCard delay={index * 0.1} className="h-full cursor-pointer transition-shadow hover:shadow-xl">
                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                      <module.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md">{getStatsForModule(module.statsKey)}</span>
                      <ArrowRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border/50 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-all cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'team' ? 'bg-purple-500' :
                    activity.type === 'found' ? 'bg-blue-500' :
                    activity.type === 'crew' ? 'bg-orange-500' :
                    activity.type === 'mentor' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="flex-1 text-sm">{activity.text}</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity yet. Start exploring the campus!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
