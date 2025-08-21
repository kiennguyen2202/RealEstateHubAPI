
import axiosClient from './axiosClient';

export const postService = {
  getPostsByUser: async (userId) => {
    const res = await axiosClient.get(`/api/posts/user/${userId}`);
    return res.data;
  },
  getPostById: async (postId) => {
    const res = await axiosClient.get(`/api/posts/${postId}`);
    return res.data;
  }
};