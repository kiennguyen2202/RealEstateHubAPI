
import axiosClient from './axiosClient';

export const postService = {
  getPostsByUser: async (userId) => {
    const res = await axiosClient.get(`/api/posts/user/${userId}`);
    return res.data;
  }
};