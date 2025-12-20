import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, User } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, Timestamp, collectionGroup, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ChatBox, generateChatId } from '@/components/messaging/ChatBox';

interface Conversation {
  odst: string;
  odtherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  chatId: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderPhoto?: string;
  receiverPhoto?: string;
  text: string;
  timestamp: Date;
  chatId: string;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('chat'));
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [postContext, setPostContext] = useState<{ postId?: string; postType?: string; postName?: string }>({});

  // Get conversations by listening to all chats that include current user
  useEffect(() => {
    if (!user) return;

    console.log('Messages: Setting up conversation listener for user:', user.uid);

    // Listen to all messages across all chats using collectionGroup
    const messagesQuery = query(
      collectionGroup(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const conversationMap = new Map<string, Conversation>();
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const senderId = data.senderId;
        const receiverId = data.receiverId;
        
        // Only process messages that involve the current user
        if (senderId !== user.uid && receiverId !== user.uid) return;
        
        const otherUserId = senderId === user.uid ? receiverId : senderId;
        const otherUserName = senderId === user.uid ? data.receiverName : data.senderName;
        const otherUserPhoto = senderId === user.uid ? data.receiverPhoto : data.senderPhoto;
        const chatId = data.chatId || generateChatId(user.uid, otherUserId);
        
        if (!conversationMap.has(otherUserId)) {
          const timestamp = data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp);
          
          conversationMap.set(otherUserId, {
            odst: doc.id,
            odtherUserId: otherUserId,
            otherUserName: otherUserName || 'Unknown User',
            otherUserPhoto: otherUserPhoto,
            lastMessage: data.text,
            lastMessageTime: timestamp,
            unread: data.receiverId === user.uid && !data.read,
            chatId: chatId
          });
        }
      });

      console.log('Messages: Found', conversationMap.size, 'conversations');
      setConversations(Array.from(conversationMap.values()));
    }, (error) => {
      console.error('Messages: Error listening to conversations:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle chat param from URL
  useEffect(() => {
    const chatUserId = searchParams.get('chat');
    const userName = searchParams.get('name');
    const postId = searchParams.get('postId');
    const postType = searchParams.get('postType');
    const postName = searchParams.get('postName');
    
    if (chatUserId) {
      console.log('Messages: Opening chat with user:', chatUserId);
      setSelectedUserId(chatUserId);
      if (userName) setSelectedUserName(decodeURIComponent(userName));
      setPostContext({
        postId: postId || undefined,
        postType: postType || undefined,
        postName: postName ? decodeURIComponent(postName) : undefined
      });
    }
  }, [searchParams]);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedUserId(conv.odtherUserId);
    setSelectedUserName(conv.otherUserName);
    setPostContext({}); // Clear post context when selecting from list
  };

  const handleCloseChat = () => {
    setSelectedUserId(null);
    setSelectedUserName('');
    setPostContext({});
    navigate('/messages', { replace: true });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-12rem)]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Chat with campus members</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <div className="md:col-span-1 bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence>
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv, index) => (
                    <motion.div
                      key={conv.odtherUserId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-secondary/50 ${
                        selectedUserId === conv.odtherUserId ? 'bg-secondary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {conv.otherUserPhoto ? (
                            <img src={conv.otherUserPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{conv.otherUserName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.unread && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start chatting from user profiles</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col">
            {selectedUserId ? (
              <ChatBox
                recipientId={selectedUserId}
                recipientName={selectedUserName}
                onClose={handleCloseChat}
                postId={postContext.postId}
                postType={postContext.postType}
                postName={postContext.postName}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">or start a new chat from someone's profile</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
