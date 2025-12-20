import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROLES } from './CrewCallCard';

interface CrewCallFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
}

export const CrewCallFilters = ({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus
}: CrewCallFiltersProps) => {
  const hasFilters = searchQuery || selectedRole || selectedStatus;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole(null);
    setSelectedStatus(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by role, club, or event..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        
        {/* Role Filters */}
        {ROLES.map(({ name, emoji }) => (
          <Badge
            key={name}
            variant={selectedRole === name ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              selectedRole === name 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-primary/10 hover:border-primary/50'
            }`}
            onClick={() => setSelectedRole(selectedRole === name ? null : name)}
          >
            {emoji} {name}
          </Badge>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Status Filters */}
        <Badge
          variant={selectedStatus === 'open' ? 'default' : 'outline'}
          className={`cursor-pointer transition-all ${
            selectedStatus === 'open' 
              ? 'bg-green-500/20 text-green-400 border-green-500/50' 
              : 'hover:bg-green-500/10 hover:border-green-500/30'
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'open' ? null : 'open')}
        >
          🟢 Open
        </Badge>
        <Badge
          variant={selectedStatus === 'closed' ? 'default' : 'outline'}
          className={`cursor-pointer transition-all ${
            selectedStatus === 'closed' 
              ? 'bg-destructive/20 text-destructive border-destructive/50' 
              : 'hover:bg-destructive/10 hover:border-destructive/30'
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'closed' ? null : 'closed')}
        >
          🔴 Closed
        </Badge>

        {/* Clear Filters */}
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};
