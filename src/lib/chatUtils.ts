import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Generate consistent chatId by sorting user IDs alphabetically
export const generateChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Find or create a chat between two users
export const findOrCreateChat = async (
  currentUserId: string,
  otherUserId: string
): Promise<string> => {
  const chatId = generateChatId(currentUserId, otherUserId);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUserId, otherUserId].sort(),
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    });
  }

  return chatId;
};

// Send a structured message to a chat
export interface StructuredMessage {
  type: 'crew_application' | 'team_join_request' | 'text';
  text: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  data?: Record<string, unknown>;
}

export const sendStructuredMessage = async (
  chatId: string,
  message: StructuredMessage
): Promise<void> => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  await addDoc(messagesRef, {
    ...message,
    timestamp: serverTimestamp(),
    read: false,
    chatId
  });

  // Update last message on chat document
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(chatRef, {
    lastMessage: message.text.substring(0, 100),
    lastMessageAt: serverTimestamp()
  }, { merge: true });
};

// Format application data for chat message
export const formatCrewApplicationMessage = (
  applicationData: {
    fullName: string;
    email: string;
    skills: string[];
    experience: string;
    message: string;
    resumeUrl?: string;
  },
  crewCallTitle: string
): string => {
  let text = `📋 **New Crew Call Application**\n\n`;
  text += `**Position:** ${crewCallTitle}\n`;
  text += `**Name:** ${applicationData.fullName}\n`;
  text += `**Email:** ${applicationData.email}\n`;
  text += `**Skills:** ${applicationData.skills.join(', ')}\n\n`;
  
  if (applicationData.experience) {
    text += `**Experience:**\n${applicationData.experience}\n\n`;
  }
  
  text += `**Message:**\n${applicationData.message}`;
  
  if (applicationData.resumeUrl) {
    text += `\n\n📎 Resume attached`;
  }
  
  return text;
};

// Format join request data for chat message  
export const formatTeamJoinMessage = (
  joinData: {
    fullName: string;
    email: string;
    skills: string[];
    role: string;
    bio: string;
    resumeUrl?: string;
  },
  teamName: string
): string => {
  let text = `🤝 **Team Join Request**\n\n`;
  text += `**Team:** ${teamName}\n`;
  text += `**Name:** ${joinData.fullName}\n`;
  text += `**Email:** ${joinData.email}\n`;
  text += `**Preferred Role:** ${joinData.role}\n`;
  text += `**Skills:** ${joinData.skills.join(', ')}\n\n`;
  text += `**About:**\n${joinData.bio}`;
  
  if (joinData.resumeUrl) {
    text += `\n\n📎 Resume attached`;
  }
  
  return text;
};
