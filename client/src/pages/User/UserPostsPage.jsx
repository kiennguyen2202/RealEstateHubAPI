import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import PropertyCard from "../../components/property/PropertyCard";
import { FaUser, FaPhone, FaEnvelope, FaCrown, FaArrowLeft } from "react-icons/fa";
import { isProRole } from "../../utils/roleUtils";
import "./UserPostsPage.css";

const UserPostsPage = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        // Fetch all approved posts and filter by userId
        const response = await axiosClient.get('/api/posts', {
          params: { isApproved: true }
        });
        
        const allPosts = response.data || [];
        const userPosts = allPosts.filter(p => p.userId === parseInt(userId));
        setPosts(userPosts);
        
        // Get user info from first post
        if (userPosts.length > 0 && userPosts[0].user) {
          setUserInfo(userPosts[0].user);
        }
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('Không thể tải danh sách bài đăng');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="user-posts-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-posts-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-posts-page">
      {/* Back button */}
      <Link to="/" className="back-link">
        <FaArrowLeft /> Quay lại
      </Link>

      {/* User Info Header */}
      {userInfo && (
        <div className="user-info-header">
          <div className="user-avatar-large">
            <img
              src={userInfo.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${userInfo.avatarUrl}` : '/default-avatar.png'}
              alt={userInfo.name}
            />
            {isProRole(userInfo.role) && (
              <span className="pro-badge-corner">
                <FaCrown />
              </span>
            )}
          </div>
          <div className="user-details">
            <h1 className="user-name">
              {userInfo.name}
              {isProRole(userInfo.role) && (
                <span className="pro-badge-inline">
                  <FaCrown /> Pro
                </span>
              )}
            </h1>
            <div className="user-contact">
              {userInfo.phone && (
                <span className="contact-info">
                  <FaPhone /> {userInfo.phone}
                </span>
              )}
              {userInfo.email && (
                <span className="contact-info">
                  <FaEnvelope /> {userInfo.email}
                </span>
              )}
            </div>
            <div className="user-stats">
              <span className="stat-item">
                <strong>{posts.length}</strong> tin đăng
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="posts-section">
        <h2 className="section-title">
          Tin đăng của {userInfo?.name || 'người dùng'}
        </h2>
        
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>Người dùng này chưa có tin đăng nào.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <PropertyCard key={post.id} property={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostsPage;
