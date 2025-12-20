import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Search, 
  Users, 
  Megaphone, 
  GraduationCap,
  Bell,
  LogOut,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
  { path: '/lost-found', label: 'Lost & Found', icon: Search },
  { path: '/team-finder', label: 'Team Finder', icon: Users },
  { path: '/crew-call', label: 'Crew Call', icon: Megaphone },
  { path: '/mentorship', label: 'Mentorship', icon: GraduationCap },
  { path: '/alerts', label: 'Alerts', icon: Bell },
];

export const Navbar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 bg-card/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-lg">The Quad</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile?.name}</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Q</span>
          </div>
          <span className="font-semibold">The Quad</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
        >
          <div className="flex justify-end p-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-4 p-6">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={item.path} 
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 rounded-xl text-lg',
                    location.pathname === item.path 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <Button 
              variant="ghost" 
              className="mt-6 text-destructive"
              onClick={() => { logout(); setMobileOpen(false); }}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );
};
