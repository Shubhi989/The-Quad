import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MapPin, Clock, X, Upload, Trash2 } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { RadarAnimation } from '@/components/ui/RadarAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LostItem {
  id: string;
  item_name: string;
  description: string;
  location: string;
  type: 'lost' | 'found';
  userId: string;
  imageUrl?: string;
}

const DEMO_ITEMS: LostItem[] = [
  { id: 'demo1', item_name: 'MacBook Charger', description: 'White 67W USB-C charger, left in Main Library 2nd floor', location: 'Main Library', type: 'lost', userId: 'demo' },
  { id: 'demo2', item_name: 'Student ID Card', description: 'Found near Tech Park entrance, name starts with R', location: 'Tech Park', type: 'found', userId: 'demo' },
  { id: 'demo3', item_name: 'Blue Backpack', description: 'JanSport backpack with laptop and notebooks inside', location: 'Cafeteria', type: 'lost', userId: 'demo' },
  { id: 'demo4', item_name: 'AirPods Pro Case', description: 'White case found on bench, has small scratch', location: 'Sports Complex', type: 'found', userId: 'demo' },
  { id: 'demo5', item_name: 'Scientific Calculator', description: 'TI-84 Plus, has stickers on back', location: 'Engineering Block', type: 'lost', userId: 'demo' },
];

// Compress image to base64 (max 200KB for Firestore)
const compressImage = (file: File, maxWidth = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function LostFound() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LostItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<LostItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    location: '',
    type: 'lost' as 'lost' | 'found',
    imageUrl: ''
  });
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const handleContact = (e: React.MouseEvent, item: LostItem) => {
    e.stopPropagation();
    if (item.userId === 'demo') {
      toast({ title: 'Demo Item', description: 'This is a demo item with no real user' });
      return;
    }
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to contact the owner', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (item.userId === user.uid) {
      toast({ title: 'Your Post', description: 'This is your own post' });
      return;
    }
    // Navigate to messages with context
    navigate(`/messages?chat=${item.userId}&name=Item Owner&postId=${item.id}&postType=${item.type}&postName=${encodeURIComponent(item.item_name)}`);
  };

  const handleDelete = async () => {
    if (!user || !deleteItemId) return;
    try {
      await deleteDoc(doc(db, 'lost_items', deleteItemId));
      toast({ title: 'Deleted', description: 'Item removed successfully' });
      setDeleteItemId(null);
      setSelectedPost(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setDeleteItemId(itemId);
  };

  useEffect(() => {
    const q = query(collection(db, 'lost_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        item_name: doc.data().item_name || '',
        description: doc.data().description || '',
        location: doc.data().location || '',
        type: doc.data().type || 'lost',
        userId: doc.data().userId || '',
        imageUrl: doc.data().imageUrl || ''
      })) as LostItem[];
      setItems(itemsData.length > 0 ? itemsData : DEMO_ITEMS);
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setFormData({ ...formData, imageUrl: compressed });
    } catch {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      await addDoc(collection(db, 'lost_items'), {
        item_name: formData.item_name,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        userId: user.uid,
        imageUrl: formData.imageUrl || ''
      });
      toast({ title: 'Success', description: 'Item posted successfully!' });
      setShowForm(false);
      setImagePreview(null);
      setFormData({ item_name: '', description: '', location: '', type: 'lost', imageUrl: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post item', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(item => {
    const itemName = item.item_name || '';
    const description = item.description || '';
    const location = item.location || '';
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const radarItems = filteredItems.slice(0, 5).map((item, i) => ({
    x: Math.cos((i / 5) * Math.PI * 2) * 0.7,
    y: Math.sin((i / 5) * Math.PI * 2) * 0.7,
    label: item.item_name || 'Item'
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Lost & Found</h1>
            <p className="text-muted-foreground">Help find lost items or report found ones</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Post Item
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'lost', 'found'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Radar Animation */}
          <div className="lg:col-span-1 flex justify-center items-center">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h3 className="text-center text-sm text-muted-foreground mb-4">Scanning Campus...</h3>
              <RadarAnimation size={200} items={radarItems} />
              <p className="text-center text-sm text-muted-foreground mt-4">
                {filteredItems.length} items nearby
              </p>
            </div>
          </div>

          {/* Items Grid */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateX: 15 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                  whileHover={{ 
                    scale: 1.02, 
                    rotateY: 2,
                    transition: { duration: 0.2 }
                  }}
                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                  onClick={() => setSelectedPost(item)}
                  className="cursor-pointer"
                >
                  <GlowCard className="p-4">
                    <div className="flex items-start gap-4">
                      {item.imageUrl && (
                        <motion.div 
                          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary cursor-pointer"
                          whileHover={{ scale: 1.1, rotateZ: 2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedImage(item.imageUrl || null);
                          }}
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.item_name} 
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>
                            {(item.type || 'lost').toUpperCase()}
                          </Badge>
                          <h3 className="font-semibold truncate">{item.item_name || 'Unnamed Item'}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description || 'No description'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.location || 'Unknown location'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Recently
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Posted by Campus Member</span>
                      <div className="flex gap-2">
                        {user && item.userId === user.uid && !item.id.startsWith('demo') && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={(e) => openDeleteConfirm(e, item.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={(e) => handleContact(e, item)}>
                          Contact
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No items found. Try adjusting your search.
              </div>
            )}
          </div>
        </div>

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {zoomedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setZoomedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.5, rotateY: -90 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0.5, rotateY: 90 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative max-w-2xl max-h-[80vh]"
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                <img 
                  src={zoomedImage} 
                  alt="Zoomed item" 
                  className="w-full h-full object-contain rounded-xl shadow-2xl"
                />
                <button
                  onClick={() => setZoomedImage(null)}
                  className="absolute -top-4 -right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteItemId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Post Detail Modal */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedPost(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 p-2 bg-secondary rounded-full hover:scale-110 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-4">
                  <Badge variant={selectedPost.type === 'lost' ? 'destructive' : 'default'} className="text-sm">
                    {(selectedPost.type || 'lost').toUpperCase()}
                  </Badge>

                  <h2 className="text-2xl font-bold">{selectedPost.item_name || 'Unnamed Item'}</h2>

                  {selectedPost.imageUrl && (
                    <motion.div 
                      className="w-full h-64 rounded-xl overflow-hidden bg-secondary cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setZoomedImage(selectedPost.imageUrl || null)}
                    >
                      <img 
                        src={selectedPost.imageUrl} 
                        alt={selectedPost.item_name} 
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}

                  <p className="text-muted-foreground">{selectedPost.description || 'No description'}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {selectedPost.location || 'Unknown location'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Recently
                    </span>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-3">
                    {user && selectedPost.userId === user.uid && !selectedPost.id.startsWith('demo') && (
                      <Button 
                        variant="destructive"
                        onClick={(e) => openDeleteConfirm(e, selectedPost.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    )}
                    <Button 
                      variant="default" 
                      onClick={(e) => handleContact(e, selectedPost)}
                      className="flex-1"
                    >
                      Contact Owner
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Form Modal */}
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
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Post Item</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    {(['lost', 'found'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          formData.type === t 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Item Name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Location (e.g., Library, Cafeteria)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        'Processing...'
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {imagePreview ? 'Change Photo' : 'Add Photo (Optional)'}
                        </>
                      )}
                    </Button>
                    {imagePreview && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-secondary">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full">Post Item</Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}