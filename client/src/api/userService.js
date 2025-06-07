import axiosClient from './axiosClient';

export const userService = {
  getProfile: async () => {
    const res = await axiosClient.get('/api/users/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await axiosClient.put('/api/users/profile', data);
    return res.data;
  },
  uploadAvatar: async (formData) => {
    const res = await axiosClient.post('/api/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};