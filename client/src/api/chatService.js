import axiosPrivate from './axiosPrivate';

export const chatService = {
    // Lấy token cho Stream Chat
    getUserToken: async (userId, userName, userImage) => {
        try {
            const response = await axiosPrivate.post('/api/chat/token', {
                userId,
                userName,
                userImage
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Upsert users in Stream (server-side)
    ensureUsers: async (userIds) => {
        try {
            const response = await axiosPrivate.post('/api/chat/ensure-users', { userIds });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete a Stream channel on server
    deleteChannel: async (type, id, hardDelete = true) => {
        try {
            const response = await axiosPrivate.delete(`/api/chat/channels/${encodeURIComponent(type)}/${encodeURIComponent(id)}?hardDelete=${hardDelete}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },


    
};
