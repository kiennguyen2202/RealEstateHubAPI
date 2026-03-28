import { useEffect, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { chatService } from '../api/chatService';
import axiosPrivate from '../api/axiosPrivate';

// Use window object to persist across HMR reloads
if (!window.__messageNotificationState) {
  window.__messageNotificationState = {
    globalClient: null,
    listenerAttached: false,
    processedMessages: new Set(),
    currentUserId: null
  };
}

const state = window.__messageNotificationState;

export const useMessageNotifications = (user) => {
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (!user || hasInitRef.current) return;
    hasInitRef.current = true;
    state.currentUserId = String(user.id);

    const init = async () => {
      try {
        const { token, apiKey } = await chatService.getUserToken(user.id, user.name, user.avatarUrl);

        state.globalClient = state.globalClient || StreamChat.getInstance(apiKey);

        if (!state.globalClient.userID) {
          await state.globalClient.connectUser(
            {
              id: String(user.id),
              name: user.name,
              image: user.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${user.avatarUrl}` : undefined,
            },
            token
          );
        }

        // Only attach listener once globally
        if (!state.listenerAttached) {
          state.listenerAttached = true;
          
          state.globalClient.on('message.new', async (event) => {
            const messageId = event.message?.id;
            
            // Skip if no messageId, already processed, or from current user
            if (!messageId || state.processedMessages.has(messageId)) return;
            if (event.message?.user?.id === state.currentUserId) return;
            
            // Mark as processed immediately to prevent duplicates
            state.processedMessages.add(messageId);
            
            // Cleanup old messages (keep last 50)
            if (state.processedMessages.size > 100) {
              const arr = Array.from(state.processedMessages);
              arr.slice(0, 50).forEach(id => state.processedMessages.delete(id));
            }
            
            console.log('📩 Global message notification:', event.message?.user?.name);
            
            try {
              const channelData = event.channel || {};
              const senderName = event.message?.user?.name || 'Người dùng';
              const senderId = parseInt(event.message?.user?.id) || null;
              const postId = channelData.postId ? parseInt(channelData.postId) : null;
              const userId = parseInt(state.currentUserId);

              await axiosPrivate.post('/api/notifications', {
                userId,
                senderId,
                postId,
                title: `Tin nhắn mới từ ${senderName}`,
                message: event.message?.text?.substring(0, 100) || 'Bạn có tin nhắn mới',
                type: 'message'
              });
              
              console.log('✅ Global message notification created');
            } catch (err) {
              console.error('❌ Error:', err);
            }
          });
        }

        console.log('✅ Global message notifications initialized');
      } catch (err) {
        console.error('❌ Global message notifications failed:', err);
      }
    };

    init();

    return () => {
      hasInitRef.current = false;
    };
  }, [user?.id]);
};
