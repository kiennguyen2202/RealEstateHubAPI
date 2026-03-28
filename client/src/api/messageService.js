import axiosClient from './axiosClient';

export const messageService = {
    // Gửi tin nhắn mới
    sendMessage: async (messageData) => {
        try {
            const response = await axiosClient.post('/api/messages', messageData);
            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw new Error(error.response.data);
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
            }
        }
    },

    // Lấy quick replies từ BE
    getQuickReplies: async () => {
        try {
            const response = await axiosClient.get('/api/messages/quick-replies');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy tất cả tin nhắn của một người dùng (for backward compatibility)
    getUserMessages: async (userId) => {
        try {
            const response = await axiosClient.get(`/api/messages/user/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy danh sách hội thoại
    getConversations: async (userId) => {
        try {
            const response = await axiosClient.get(`/api/messages/conversations/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy cuộc hội thoại giữa 2 người dùng về một bài đăng
    getConversation: async (user1Id, user2Id, postId) => {
        try {
            const response = await axiosClient.get(`/api/messages/${user1Id}/${user2Id}/${postId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Gửi typing indicator
    sendTypingIndicator: async (typingData) => {
        try {
            const response = await axiosClient.post('/api/messages/typing', typingData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Đánh dấu tin nhắn đã đọc
    markAsRead: async (readData) => {
        try {
            const response = await axiosClient.post('/api/messages/read', readData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Xóa hội thoại
    deleteConversation: async (user1Id, user2Id, postId) => {
        try {
            const response = await axiosClient.delete(
                `/api/messages/conversation`,
                { params: { user1Id, user2Id, postId } }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Xóa hội thoại thất bại';
        }
    },
}; 
