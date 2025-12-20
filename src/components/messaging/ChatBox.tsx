import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, ArrowLeft } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy, Timestamp, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  text: string;
  timestamp: Date;
}

interface ChatBoxProps {
  recipientId: string;
  recipientName: string;
  onClose?: () => void;
  postId?: string;
  postType?: string;
  postName?: string;
}

// Generate consistent chatId by sorting user IDs alphabetically
export const generateChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

export function ChatBox({ recipientId, recipientName, onClose, postId, postType, postName }: ChatBoxProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; photo?: string } | null>(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [chatExists, setChatExists] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate consistent chatId
  const chatId = user ? generateChatId(user.uid, recipientId) : '';

  // Fetch recipient info
  useEffect(() => {
    const fetchRecipient = async () => {
      try {
        const docRef = doc(db, 'users', recipientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecipientInfo({
            name: docSnap.data().name || recipientName,
            photo: docSnap.data().photoURL
          });
        } else {
          setRecipientInfo({ name: recipientName });
        }
      } catch {
        setRecipientInfo({ name: recipientName });
      }
    };
    fetchRecipient();
  }, [recipientId, recipientName]);

  // Check if chat document exists and listen for changes
  useEffect(() => {
    if (!user || !chatId) return;

    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      setChatExists(docSnap.exists());
    });

    return () => unsubscribe();
  }, [user, chatId]);

  // Listen to messages using chatId subcollection
  useEffect(() => {
    if (!user || !chatId) {
      console.log('ChatBox: No user or chatId');
      return;
    }

    console.log('ChatBox: Setting up listener for chatId:', chatId);

    // Listen to messages in the chat's subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('ChatBox: Received', snapshot.docs.length, 'messages');
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          senderName: data.senderName,
          receiverName: data.receiverName,
          text: data.text,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp)
        };
      });
      setMessages(msgs);
    }, (error) => {
      console.error('ChatBox: Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [user, chatId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure chat document exists before sending messages
  const ensureChatExists = async (): Promise<boolean> => {
    if (!user || !chatId) return false;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        // Create the chat document with participants
        await setDoc(chatRef, {
          participants: [user.uid, recipientId].sort(),
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp()
        });
        console.log('Chat document created:', chatId);
      }
      return true;
    } catch (error) {
      console.error('Failed to create chat document:', error);
      return false;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || sending || !chatId) return;

    setSending(true);
    try {
      // Ensure chat document exists before sending message
      const chatReady = await ensureChatExists();
      if (!chatReady) {
        toast({ title: 'Error', description: 'Failed to initialize chat', variant: 'destructive' });
        setSending(false);
        return;
      }

      const messageData: Record<string, unknown> = {
        senderId: user.uid,
        receiverId: recipientId,
        senderName: profile.name || 'Anonymous',
        senderPhoto: profile.photoURL || '',
        receiverName: recipientInfo?.name || recipientName,
        receiverPhoto: recipientInfo?.photo || '',
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        chatId: chatId
      };

      // Add post context if available
      if (postId) {
        messageData.postId = postId;
        messageData.postType = postType;
        messageData.postName = postName;
      }

      // Add message to chat subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Update last message on chat document
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp()
      }, { merge: true });

      console.log('Message sent successfully to chatId:', chatId);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Send initial message if coming from a post
  useEffect(() => {
    if (postId && postName && !initialMessageSent && messages.length === 0 && user && profile) {
      // Check if there's already a conversation about this post
      const hasPostMessage = messages.some((m) => m.text.includes(postName));
      if (!hasPostMessage) {
        setInitialMessageSent(true);
      }
    }
  }, [postId, postName, initialMessageSent, messages, user, profile]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          {recipientInfo?.photo ? (
            <img src={recipientInfo.photo} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{recipientInfo?.name || recipientName}</h3>
          <p className="text-xs text-muted-foreground">Campus Member</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Post Context Banner */}
      {postId && postName && (
        <div className="px-4 py-2 bg-primary/10 border-b border-border/50">
          <p className="text-sm">
            <span className="text-muted-foreground">Regarding </span>
            <span className="font-medium text-primary">{postType === 'lost' ? '🔴 Lost' : '🟢 Found'}</span>
            <span className="text-muted-foreground">: </span>
            <span className="font-semibold">{postName}</span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-secondary"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
