import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axiosPrivate from '../api/axiosPrivate';
import { postService } from '../api/postService';
import { userService } from '../api/userService.js';
import './Profile.css';
import PropertyCard from '../components/property/PropertyCard';
import { FaPen } from 'react-icons/fa';

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data);
        setProfile({ 
          name: data.name || '', 
          email: data.email || '', 
          phone: data.phone || '', 
          avatar: data.avatarUrl || '' 
        });
        setAvatarPreview("http://localhost:5134" + (data.avatarUrl || ''));
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setMessage('Không thể tải thông tin người dùng');
      }
    };

    if (authUser) {
      fetchUser();
      fetchUserPosts();
    }
  }, [authUser]);

  const fetchUserPosts = async () => {
    try {
      const data = await postService.getPostsByUser(authUser.id);
      setUserPosts(data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setUserPosts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let avatarUrl = user?.avatarUrl;
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        const res = await userService.uploadAvatar(formData);
        avatarUrl = res.avatarUrl;
      }
      
      await userService.updateProfile({ ...profile, avatarUrl });
      setMessage('Cập nhật thông tin thành công!');
      setUser(prev => ({ ...prev, ...profile, avatarUrl }));
      // Reset avatar state after successful update
      setAvatar(null);
    } catch (error) {
      setMessage('Có lỗi xảy ra khi cập nhật thông tin');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await axiosPrivate.delete(`/api/posts/${postId}`);
        setUserPosts(userPosts.filter(post => post.id !== postId));
        setMessage('Xóa bài viết thành công!');
      } catch (error) {
        setMessage('Có lỗi xảy ra khi xóa bài viết');
        console.error('Error deleting post:', error);
      }
    }
  };

  if (!authUser) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="not-logged-in">
            <h2>Vui lòng đăng nhập để xem thông tin cá nhân</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <h1 className="profile-title">Trang cá nhân</h1>
          <p className="profile-subtitle">Quản lý thông tin và bài đăng của bạn</p>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i>
            Thông tin cá nhân
          </button>
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <i className="fas fa-list"></i>
            Bài đăng của tôi
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="profile-card">
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="profile-avatar-section">
                    {/* Avatar bên trái */}
                    <div className="profile-avatar-wrapper" onClick={() => document.getElementById('avatarInput').click()}>
                      <img
                        src={avatarPreview || '/default-avatar.png'}
                        alt="Avatar"
                        className="profile-avatar"
                      />
                      <div className="avatar-overlay">
                        <span className="edit-icon"><FaPen /></span>
                      </div>
                      <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                      />
                    </div>

                    {/* Thông tin bên phải */}
                    <div className="profile-info-section">
                      <div className="user-info">
                        <h3 className="user-name">{user?.name || authUser.name}</h3>
                        <p className={`user-role ${user?.role?.toLowerCase() || 'member'}`}>
                          <i className={`fas ${
                            user?.role === 'Admin' ? 'fa-shield-alt' : 
                            (user?.role === 'Pro_1' || user?.role === 'Pro_3' || user?.role === 'Pro_12') ? 'fa-crown' : 'fa-user'
                          }`}></i>
                          {user?.role === 'Admin' ? 'Quản trị viên' : 
                           (user?.role === 'Pro_1' || user?.role === 'Pro_3' || user?.role === 'Pro_12') ? 'Thành viên Pro' : 'Thành viên'}
                        </p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>

                       {message && (
                         <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
                           {message}
                         </div>
                       )}

                       <div className="profile-actions">
                         <button type="submit" className="btn btn-primary" disabled={loading}>
                           {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                         </button>
                       </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="posts-content">
              <div className="posts-header">
                <h3>Bài đăng của tôi ({userPosts.length})</h3>
                        <Link to="/dang-tin" className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Đăng tin mới
        </Link>
              </div>

              {userPosts.length === 0 ? (
                <div className="no-posts">
                  <i className="fas fa-file-alt no-posts-icon"></i>
                  <h4>Bạn chưa có bài đăng nào</h4>
                  <p>Bắt đầu đăng tin bất động sản đầu tiên của bạn</p>
                  <a href="/dang-tin" className="btn btn-primary">
                    Đăng tin ngay
                  </a>
                </div>
              ) : (
                <div className="properties-grid">
                  {userPosts.map(post => (
                    <PropertyCard key={post.id} property={post} showFavorite={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
