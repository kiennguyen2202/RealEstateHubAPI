import axiosClient from './axiosClient';

export const messageService = {
    // Gửi tin nhắn mới
    sendMessage: async (messageData) => {
        try {
            const response = await axiosClient.post('/api/messages', messageData);
            return response.data;
        } catch (error) {
            if (error.response?.data) {
                // If the server returns a specific error message
                throw new Error(error.response.data);
            } else if (error.response?.data?.message) {
                // If the server returns an object with a message property
                throw new Error(error.response.data.message);
            } else {
                throw new Error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
            }
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

    // Lấy tất cả tin nhắn của một người dùng
    getUserMessages: async (userId) => {
        try {
            const response = await axiosClient.get(`/api/messages/user/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy tất cả tin nhắn của một bài đăng
    getPostMessages: async (postId) => {
        try {
            const response = await axiosClient.get(`/api/messages/post/${postId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
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
