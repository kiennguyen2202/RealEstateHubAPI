import React, { useEffect, useState } from 'react';
import { postService } from '../api/postService';
import { useAuth } from '../auth/AuthContext';
import PropertyCard from '../components/property/PropertyCard'; 

const PostHistory = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await postService.getPostsByUser(user.id); 
        setPosts(data);
      } catch (err) {
        setPosts([]);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto mt-28">
      <h2 className="text-2xl font-bold mb-4">Danh sách bài đăng của tôi</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : posts.length === 0 ? (
        <div>Bạn chưa có bài đăng nào.</div>
      ) : (
        <div className="properties-grid">
          {posts.map(post => (
            <PropertyCard key={post.id} property={post} showFavorite={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostHistory;