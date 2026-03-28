import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import axiosClient from '../../api/axiosClient';
import { userService } from '../../api/userService';
import { 
  FaHome, FaList, FaHeart, FaHistory, FaBell, FaCog, 
  FaEye, FaPhone, FaEdit, FaTrash, FaRocket, FaClock,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaChartLine,
  FaPlus, FaFilter, FaSearch, FaCamera, FaLock, FaUser,
  FaCrown, FaExclamationTriangle, FaPen
} from 'react-icons/fa';
import { formatPrice } from '../../utils/priceUtils';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL or default to 'overview'
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    pendingPosts: 0,
    expiredPosts: 0,
    totalViews: 0,
    totalContacts: 0
  });
  const [postQuota, setPostQuota] = useState({
    limit: 0,
    windowDays: 0,
    usedPosts: 0,
    remainingPosts: 0,
    role: 'User'
  });
  const [loading, setLoading] = useState(true);
  const [postFilter, setPostFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Profile edit state
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    avatar: null
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    // Update URL when tab changes
    navigate(`/dashboard?tab=${activeTab}`, { replace: true });
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's posts
      const postsRes = await axiosClient.get('/api/posts/my-posts');
      const userPosts = postsRes.data || [];
      setPosts(userPosts);
      
      // Calculate stats
      const active = userPosts.filter(p => p.isApproved && new Date(p.expiryDate) > new Date()).length;
      const pending = userPosts.filter(p => !p.isApproved && !p.isRejected).length;
      const expired = userPosts.filter(p => new Date(p.expiryDate) <= new Date()).length;
      const rejected = userPosts.filter(p => p.isRejected).length;
      const totalViews = userPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const totalContacts = userPosts.reduce((sum, p) => sum + (p.contactCount || 0), 0);
      
      setStats({
        totalPosts: userPosts.length,
        activePosts: active,
        pendingPosts: pending,
        expiredPosts: expired,
        rejectedPosts: rejected,
        totalViews,
        totalContacts
      });

      // Fetch saved posts - sử dụng đúng endpoint với userId
      try {
        const savedRes = await axiosClient.get(`/api/favorites/user/${user.id}`);
        // API trả về favorites với post bên trong, cần map ra posts
        const savedPostsData = (savedRes.data || []).map(fav => ({
          ...fav.post,
          favoriteId: fav.id,
          savedAt: fav.createdFavorite
        }));
        setSavedPosts(savedPostsData);
      } catch (e) {
        console.log('Saved posts not available:', e);
        setSavedPosts([]);
      }

      // Fetch transactions - lấy từ payment history
      try {
        const transRes = await axiosClient.get(`/api/payment/history?userId=${user.id}`);
        setTransactions(transRes.data || []);
      } catch (e) {
        console.log('Transactions not available:', e);
        setTransactions([]);
      }

      // Fetch notifications - cần truyền userId
      try {
        const notiRes = await axiosClient.get(`/api/notifications?userId=${user.id}`);
        setNotifications(notiRes.data || []);
      } catch (e) {
        console.log('Notifications not available:', e);
        setNotifications([]);
      }

      // Set profile form
      setProfileForm({
        fullName: user?.fullName || user?.userName || '',
        phone: user?.phoneNumber || '',
        email: user?.email || '',
        avatar: null
      });

      // Fetch post quota
      try {
        const quotaRes = await userService.getPostQuota();
        setPostQuota(quotaRes);
      } catch (e) {
        console.log('Post quota not available:', e);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin này?')) return;
    try {
      await axiosClient.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPosts: prev.totalPosts - 1
      }));
    } catch (error) {
      alert('Không thể xóa tin đăng');
    }
  };

  const handleBoostPost = async (postId) => {
    // Navigate to boost/payment page
    navigate(`/boost-post/${postId}`);
  };

  const handleExtendPost = async (postId) => {
    // Navigate to extend page
    navigate(`/extend-post/${postId}`);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('fullName', profileForm.fullName);
      formData.append('phone', profileForm.phone);
      if (profileForm.avatar) {
        formData.append('avatar', profileForm.avatar);
      }
      await axiosClient.put('/api/users/dashboard', formData);
      alert('Cập nhật thông tin thành công!');
      setEditProfile(false);
    } catch (error) {
      alert('Không thể cập nhật thông tin');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      await axiosClient.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.');
    }
  };

  // Xóa tin khỏi danh sách đã lưu
  const handleRemoveSaved = async (userId, postId, e) => {
    e.stopPropagation();
    try {
      await axiosClient.delete(`/api/favorites/user/${userId}/post/${postId}`);
      setSavedPosts(savedPosts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error removing saved post:', error);
      alert('Không thể xóa tin khỏi danh sách đã lưu');
    }
  };

  const filteredPosts = posts.filter(post => {
    // Filter by status
    if (postFilter === 'active' && (!post.isApproved || new Date(post.expiryDate) <= new Date())) return false;
    if (postFilter === 'pending' && (post.isApproved || post.isRejected)) return false;
    if (postFilter === 'expired' && new Date(post.expiryDate) > new Date()) return false;
    if (postFilter === 'rejected' && !post.isRejected) return false;
    
    // Filter by search
    if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const getPostStatus = (post) => {
    if (post.isRejected) return { label: 'Bị từ chối', class: 'rejected', icon: FaTimesCircle };
    if (!post.isApproved) return { label: 'Chờ duyệt', class: 'pending', icon: FaHourglassHalf };
    if (new Date(post.expiryDate) <= new Date()) return { label: 'Hết hạn', class: 'expired', icon: FaClock };
    return { label: 'Đang hiển thị', class: 'active', icon: FaCheckCircle };
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="dashboard-overview">
      {/* Post Quota Card */}
      <div className="post-quota-card">
        <div className="quota-header">
          <FaPen className="quota-icon" />
          <h3>Lượt đăng tin</h3>
        </div>
        <div className="quota-content">
          <div className="quota-main">
            <span className="quota-remaining">{postQuota.remainingPosts}</span>
            <span className="quota-total">/ {postQuota.limit}</span>
          </div>
          <div className="quota-progress">
            <div 
              className="quota-progress-bar" 
              style={{ width: `${(postQuota.usedPosts / postQuota.limit) * 100}%` }}
            ></div>
          </div>
          <p className="quota-info">
            Đã dùng {postQuota.usedPosts} / {postQuota.limit} lượt trong {postQuota.windowDays} ngày
          </p>
          {postQuota.remainingPosts === 0 && (
            <p className="quota-warning">
              <FaExclamationTriangle /> Bạn đã hết lượt đăng tin. 
              <button onClick={() => navigate('/membership')} className="upgrade-link">Nâng cấp ngay</button>
            </p>
          )}
          {postQuota.remainingPosts > 0 && postQuota.remainingPosts <= 2 && (
            <p className="quota-warning low">
              <FaExclamationTriangle /> Sắp hết lượt đăng tin!
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaList /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalPosts}</span>
            <span className="stat-label">Tổng tin đăng</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaCheckCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.activePosts}</span>
            <span className="stat-label">Đang hiển thị</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FaHourglassHalf /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.pendingPosts}</span>
            <span className="stat-label">Chờ duyệt</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FaClock /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.expiredPosts}</span>
            <span className="stat-label">Hết hạn</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaEye /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalViews}</span>
            <span className="stat-label">Lượt xem</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FaPhone /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalContacts}</span>
            <span className="stat-label">Lượt liên hệ</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Thao tác nhanh</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => navigate('/dang-tin')}>
            <FaPlus /> Đăng tin mới
          </button>
          <button className="action-btn" onClick={() => setActiveTab('posts')}>
            <FaList /> Quản lý tin
          </button>
          <button className="action-btn" onClick={() => setActiveTab('saved')}>
            <FaHeart /> Tin đã lưu
          </button>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="recent-section">
        <h3>Tin đăng gần đây</h3>
        <div className="recent-posts">
          {posts.slice(0, 5).map(post => {
            const status = getPostStatus(post);
            return (
              <div key={post.id} className="recent-post-item" onClick={() => navigate(`/chi-tiet/${post.id}`)}>
                <img 
                  src={post.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${post.images[0].url}` : '/placeholder.jpg'} 
                  alt={post.title}
                  className="recent-post-image"
                />
                <div className="recent-post-info">
                  <h4>{post.title}</h4>
                  <p className="recent-post-price">{formatPrice(post.price, post.priceUnit)}</p>
                  <div className="recent-post-stats">
                    <span><FaEye /> {post.viewCount || 0}</span>
                    <span className={`status-badge ${status.class}`}>
                      <status.icon /> {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="empty-state">
              <FaHome />
              <p>Bạn chưa có tin đăng nào</p>
              <button onClick={() => navigate('/dang-tin')}>Đăng tin ngay</button>
            </div>
          )}
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="chart-section">
        <h3><FaChartLine /> Thống kê lượt xem (7 ngày qua)</h3>
        <div className="chart-placeholder">
          <div className="chart-bars">
            {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
              <div key={i} className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: `${height}%` }}></div>
                <span className="chart-label">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Posts Management Tab
  const renderPosts = () => (
    <div className="posts-management">
      <div className="posts-header">
        <h3>Quản lý tin đăng</h3>
        <button className="btn-primary" onClick={() => navigate('/dang-tin')}>
          <FaPlus /> Đăng tin mới
        </button>
      </div>

      {/* Filters */}
      <div className="posts-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${postFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPostFilter('all')}
          >
            Tất cả ({posts.length})
          </button>
          <button 
            className={`filter-tab ${postFilter === 'active' ? 'active' : ''}`}
            onClick={() => setPostFilter('active')}
          >
            Đang hiển thị ({stats.activePosts})
          </button>
          <button 
            className={`filter-tab ${postFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setPostFilter('pending')}
          >
            Chờ duyệt ({stats.pendingPosts})
          </button>
          <button 
            className={`filter-tab ${postFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setPostFilter('expired')}
          >
            Hết hạn ({stats.expiredPosts})
          </button>
          <button 
            className={`filter-tab ${postFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setPostFilter('rejected')}
          >
            Bị từ chối ({stats.rejectedPosts || 0})
          </button>
        </div>
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Tìm kiếm tin đăng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="posts-list">
        {filteredPosts.map(post => {
          const status = getPostStatus(post);
          return (
            <div key={post.id} className="post-item">
              <img 
                src={post.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${post.images[0].url}` : '/placeholder.jpg'} 
                alt={post.title}
                className="post-image"
                onClick={() => navigate(`/chi-tiet/${post.id}`)}
              />
              <div className="post-details">
                <h4 onClick={() => navigate(`/chi-tiet/${post.id}`)}>{post.title}</h4>
                <p className="post-address">
                  {post.street_Name}, {post.wardName || post.area?.ward?.name}, {post.districtName || post.area?.district?.name}
                </p>
                <div className="post-meta">
                  <span className="post-price">{formatPrice(post.price, post.priceUnit)}</span>
                  <span className="post-area">{post.area_Size} m²</span>
                  <span className={`status-badge ${status.class}`}>
                    <status.icon /> {status.label}
                  </span>
                </div>
                <div className="post-stats">
                  <span><FaEye /> {post.viewCount || 0} lượt xem</span>
                  <span><FaPhone /> {post.contactCount || 0} liên hệ</span>
                  <span><FaClock /> Hết hạn: {new Date(post.expiryDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div className="post-actions">
                <button className="action-icon edit" title="Sửa" onClick={() => navigate(`/chi-tiet/${post.id}?edit=true`)}>
                  <FaEdit />
                </button>
                <button className="action-icon boost" title="Đẩy tin" onClick={() => handleBoostPost(post.id)}>
                  <FaRocket />
                </button>
                <button className="action-icon extend" title="Gia hạn" onClick={() => handleExtendPost(post.id)}>
                  <FaClock />
                </button>
                <button className="action-icon delete" title="Xóa" onClick={() => handleDeletePost(post.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
        {filteredPosts.length === 0 && (
          <div className="empty-state">
            <FaList />
            <p>Không có tin đăng nào</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Saved Posts Tab
  const renderSaved = () => (
    <div className="saved-posts">
      <h3><FaHeart /> Tin đã lưu ({savedPosts.length})</h3>
      <div className="saved-list">
        {savedPosts.map(post => (
          <div key={post.id} className="saved-item" onClick={() => navigate(`/chi-tiet/${post.id}`)}>
            <img 
              src={post.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${post.images[0].url}` : '/placeholder.jpg'} 
              alt={post.title}
            />
            <div className="saved-info">
              <h4>{post.title}</h4>
              <p className="saved-price">{formatPrice(post.price, post.priceUnit)}</p>
              <p className="saved-address">
                {post.area?.ward?.district?.name || post.districtName}, {post.area?.ward?.district?.city?.name || post.cityName}
              </p>
              <p className="saved-meta">
                <span>{post.area_Size} m²</span>
                {post.bedrooms && <span> • {post.bedrooms} PN</span>}
              </p>
            </div>
            <button 
              className="remove-saved" 
              onClick={(e) => handleRemoveSaved(user.id, post.id, e)}
              title="Bỏ lưu"
            >
              <FaHeart />
            </button>
          </div>
        ))}
        {savedPosts.length === 0 && (
          <div className="empty-state">
            <FaHeart />
            <p>Bạn chưa lưu tin nào</p>
            <button onClick={() => navigate('/')}>Khám phá ngay</button>
          </div>
        )}
      </div>
    </div>
  );

  // Render Transactions Tab
  const renderTransactions = () => (
    <div className="transactions">
      <h3><FaHistory /> Lịch sử giao dịch</h3>
      <div className="transactions-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="transaction-item">
            <div className={`tx-icon ${tx.status === 'success' ? 'success' : 'failed'}`}>
              {tx.status === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <div className="tx-info">
              <h4>{tx.description || 'Thanh toán dịch vụ'}</h4>
              <p>
                {tx.paymentMethod && <span className="tx-method">{tx.paymentMethod}</span>}
                {tx.transactionId && <span className="tx-id"> • #{tx.transactionId}</span>}
              </p>
              <p className="tx-date">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <div className="tx-amount">
              <span className={tx.status === 'success' ? 'success' : 'failed'}>
                {tx.amount?.toLocaleString('vi-VN')} VNĐ
              </span>
              <span className={`tx-status ${tx.status}`}>
                {tx.status === 'success' ? 'Thành công' : 'Thất bại'}
              </span>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="empty-state">
            <FaHistory />
            <p>Chưa có giao dịch nào</p>
          </div>
        )}
      </div>
    </div>
  );

  // Đánh dấu thông báo đã đọc
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await axiosClient.put(`/api/notifications/${notificationId}/mark-read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Xóa thông báo
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axiosClient.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Render Notifications Tab
  const renderNotifications = () => (
    <div className="notifications-tab">
      <h3><FaBell /> Thông báo ({notifications.filter(n => !n.isRead).length} chưa đọc)</h3>
      <div className="notifications-list">
        {notifications.map((noti) => (
          <div 
            key={noti.id} 
            className={`notification-item ${noti.isRead ? '' : 'unread'}`}
            onClick={() => !noti.isRead && handleMarkNotificationRead(noti.id)}
          >
            <div className={`noti-icon ${noti.type || 'info'}`}>
              {noti.type === 'post' ? <FaList /> : 
               noti.type === 'payment' ? <FaHistory /> : 
               noti.type === 'success' ? <FaCheckCircle /> :
               noti.type === 'warning' ? <FaExclamationTriangle /> :
               <FaBell />}
            </div>
            <div className="noti-content">
              <h4>{noti.title}</h4>
              <p>{noti.message}</p>
              <span className="noti-time">{new Date(noti.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <button 
              className="noti-delete" 
              onClick={(e) => handleDeleteNotification(noti.id, e)}
              title="Xóa thông báo"
            >
              <FaTrash />
            </button>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="empty-state">
            <FaBell />
            <p>Không có thông báo mới</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Settings Tab
  const renderSettings = () => (
    <div className="settings-tab">
      {/* Profile Section */}
      <div className="settings-section">
        <h3><FaUser /> Thông tin cá nhân</h3>
        <div className="profile-card">
          <div className="profile-avatar">
            <img 
              src={user?.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${user.avatarUrl}` : (user?.avatar ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.userName || user?.name || 'User')}&background=3b82f6&color=fff`)} 
              alt="Avatar"
              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff'; }}
            />
            {editProfile && (
              <label className="avatar-upload">
                <FaCamera />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setProfileForm({...profileForm, avatar: e.target.files[0]})}

                />
              </label>
            )}
          </div>
          {!editProfile ? (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Họ tên:</span>
                <span className="info-value">{user?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Số điện thoại:</span>
                <span className="info-value">{user?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Loại tài khoản:</span>
                <span className="info-value">
                  {user?.role === 'Pro_1' || 'Pro_3' ||'Pro_12' ? (
                    <span className="pro-badge"><FaCrown /> Pro</span>
                  ) : 'Thường'}
                </span>
              </div>
              <button className="btn-edit" onClick={() => setEditProfile(true)}>
                <FaEdit /> Chỉnh sửa
              </button>
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Họ tên</label>
                <input 
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input 
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profileForm.email} disabled />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditProfile(false)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu thay đổi</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h3><FaLock /> Đổi mật khẩu</h3>
        <form className="password-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Mật khẩu hiện tại</label>
            <input 
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input 
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input 
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Đổi mật khẩu</button>
        </form>
      </div>

      {/* Upgrade to Pro */}
      {user?.role == 'Pro_1' ||'Pro_3'||'Pro_12' && (
        <div className="settings-section upgrade-section">
          <h3><FaCrown /> Nâng cấp tài khoản</h3>
          <div className="upgrade-card">
            <div className="upgrade-info">
              <h4>Trở thành thành viên Pro</h4>
              <ul>
                <li><FaCheckCircle /> Hiển thị badge Pro trên tin đăng</li>
                <li><FaCheckCircle /> Ưu tiên hiển thị trong kết quả tìm kiếm</li>
                <li><FaCheckCircle /> Đăng tin không giới hạn</li>
                <li><FaCheckCircle /> Thống kê chi tiết lượt xem</li>
              </ul>
            </div>
            <button className="btn-upgrade" onClick={() => navigate('/upgrade-pro')}>
              <FaCrown /> Nâng cấp ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img 
            src={user?.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${user.avatarUrl}` : (user?.avatar ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.userName || user?.name || 'User')}&background=3b82f6&color=fff`)} 
            alt="Avatar"
            className="sidebar-avatar"
            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff'; }}
          />
          <div className="sidebar-user">
            <h4>{user?.name}</h4>
            {user?.role === 'Pro_1' || 'Pro_3' ||'Pro_12' ? (
                    <span className="pro-badge"><FaCrown /> Pro</span>
                  ) : 'Thường'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaHome /> Tổng quan
          </button>
          <button 
            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <FaList /> Quản lý tin đăng
           
          </button>
          <button 
            className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <FaHeart /> Tin đã lưu
            
          </button>
          <button 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <FaHistory /> Lịch sử giao dịch
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Thông báo
            
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Cài đặt tài khoản
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'posts' && renderPosts()}
        {activeTab === 'saved' && renderSaved()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default UserDashboard;
