import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import axiosPrivate from '../../api/axiosPrivate';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Header.css';
import { FaCrown } from 'react-icons/fa';
import NotificationBell from '../NotificationBell';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  
  const navigate = useNavigate();
  const proDropdownRef = useRef(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [showProDropdown, setShowProDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showSaleDropdown, setShowSaleDropdown] = useState(false);
  const [showRentDropdown, setShowRentDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (proDropdownRef.current && !proDropdownRef.current.contains(event.target)) {
        setShowProDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      const fetchAgentProfile = async () => {
        try {
          const response = await axiosPrivate.get(`/api/users/${user.id}/agent-profile`);
          if (response.data) {
            setAgentProfile(response.data);
            console.log('Agent profile fetched:', response.data);
          }
        } catch (error) {
          console.log('User has no agent profile or error:', error);
          setAgentProfile(null);
        }
      };
      
      fetchAgentProfile();
    }
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePostClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/login');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <Link to="/" className="logo-link">
              <img src="https://s3-cdn.rever.vn/p/v2.48.50/images/logo-r-white.svg" alt="Real Estate Hub" className="logo-img" />
              
            </Link>
          </div>
          <nav className="main-nav">
            <ul>
              {/* Mua bán với Dropdown */}
              <li className="nav-dropdown">
                <Link 
                  to="/Sale" 
                  onMouseEnter={() => setShowSaleDropdown(true)}
                  onMouseLeave={() => setShowSaleDropdown(false)}
                >
                  Mua bán
                  <i className="fas fa-chevron-down" style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                </Link>
                {showSaleDropdown && (
                  <div 
                    className="nav-dropdown-menu"
                    onMouseEnter={() => setShowSaleDropdown(true)}
                    onMouseLeave={() => setShowSaleDropdown(false)}
                  >
                    <Link 
                      to="/Sale?type=apartment"
                      onMouseEnter={() => setShowSaleDropdown(true)}
                      onMouseLeave={() => setShowSaleDropdown(false)}
                    >
                      Căn hộ
                    </Link>
                    <Link 
                      to="/Sale?type=house"
                      onMouseEnter={() => setShowSaleDropdown(true)}
                      onMouseLeave={() => setShowSaleDropdown(false)}
                    >
                      Nhà riêng
                    </Link>
                    <Link 
                      to="/Sale?type=land"
                      onMouseEnter={() => setShowSaleDropdown(true)}
                      onMouseLeave={() => setShowSaleDropdown(false)}
                    >
                      Đất nền
                    </Link>
                    <Link 
                      to="/Sale?type=office"
                      onMouseEnter={() => setShowSaleDropdown(true)}
                      onMouseLeave={() => setShowSaleDropdown(false)}
                    >
                      Văn phòng
                    </Link>
                    <Link 
                      to="/Sale?type=shop"
                      onMouseEnter={() => setShowSaleDropdown(true)}
                      onMouseLeave={() => setShowSaleDropdown(false)}
                    >
                      Cửa hàng
                    </Link>
                  </div>
                )}
              </li>
              
              {/* Cho thuê với Dropdown */}
              <li className="nav-dropdown">
                <Link 
                  to="/Rent" 
                  onMouseEnter={() => setShowRentDropdown(true)}
                  onMouseLeave={() => setShowRentDropdown(false)}
                >
                  Cho thuê
                  <i className="fas fa-chevron-down" style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                </Link>
                {showRentDropdown && (
                  <div 
                    className="nav-dropdown-menu"
                    onMouseEnter={() => setShowRentDropdown(true)}
                    onMouseLeave={() => setShowRentDropdown(false)}
                  >
                    <Link 
                      to="/Rent?type=apartment"
                      onMouseEnter={() => setShowRentDropdown(true)}
                      onMouseLeave={() => setShowRentDropdown(false)}
                    >
                      Căn hộ
                    </Link>
                    <Link 
                      to="/Rent?type=house"
                      onMouseEnter={() => setShowRentDropdown(true)}
                      onMouseLeave={() => setShowRentDropdown(false)}
                    >
                      Nhà riêng
                    </Link>
                    <Link 
                      to="/Rent?type=office"
                      onMouseEnter={() => setShowRentDropdown(true)}
                      onMouseLeave={() => setShowRentDropdown(false)}
                    >
                      Văn phòng
                    </Link>
                    <Link 
                      to="/Rent?type=shop"
                      onMouseEnter={() => setShowRentDropdown(true)}
                      onMouseLeave={() => setShowRentDropdown(false)}
                    >
                      Cửa hàng
                    </Link>
                    <Link 
                      to="/Rent?type=warehouse"
                      onMouseEnter={() => setShowRentDropdown(true)}
                      onMouseLeave={() => setShowRentDropdown(false)}
                    >
                      Kho xưởng
                    </Link>
                  </div>
                )}
              </li>
              
              {/* Môi giới với Dropdown */}
              <li className="nav-dropdown">
                <Link 
                  to={"/agent-profile"} 
                  
                  onMouseEnter={() => setShowAgentDropdown(true)}
                  onMouseLeave={() => setShowAgentDropdown(false)}
                >
                  Môi giới
                  <i className="fas fa-chevron-down" style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                </Link>
                {showAgentDropdown && (
                  <div 
                    className="nav-dropdown-menu agent-dropdown"
                    onMouseEnter={() => setShowAgentDropdown(true)}
                    onMouseLeave={() => setShowAgentDropdown(false)}
                  >
                    <div className="agent-dropdown-header">
                      <h4>Chuyên trang môi giới</h4>
                      <p>Tìm kiếm môi giới uy tín</p>
                    </div>
                    <div className="agent-dropdown-content">
                      <Link 
                        to="/agent-profile" 
                        className="agent-dropdown-item"
                        onMouseEnter={() => setShowAgentDropdown(true)}
                        onMouseLeave={() => setShowAgentDropdown(false)}
                      >
                        <i className="fas fa-search" style={{ color: '#1890ff', marginRight: '8px' }}></i>
                        <span>Tìm môi giới</span>
                      </Link>
                      <Link 
                        to="/agent-profile/preview" 
                        className="agent-dropdown-item"
                        onMouseEnter={() => setShowAgentDropdown(true)}
                        onMouseLeave={() => setShowAgentDropdown(false)}
                      >
                        <i className="fas fa-user-plus" style={{ color: '#52c41a', marginRight: '8px' }}></i>
                        <span>Đăng ký môi giới</span>
                      </Link>
                      {user?.agentProfile && (
                        <Link 
                          to={`/agent-profile/${user.agentProfile.id}`} 
                          className="agent-dropdown-item"
                          onMouseEnter={() => setShowAgentDropdown(true)}
                          onMouseLeave={() => setShowAgentDropdown(false)}
                        >
                          <i className="fas fa-user" style={{ color: '#722ed1', marginRight: '8px' }}></i>
                          <span>Trang của tôi</span>
                        </Link>
                      )}
                      <Link 
                        to="/agent" 
                        className="agent-dropdown-item"
                        onMouseEnter={() => setShowAgentDropdown(true)}
                        onMouseLeave={() => setShowAgentDropdown(false)}
                      >
                        <i className="fas fa-trophy" style={{ color: '#fadb14', marginRight: '8px' }}></i>
                        <span>Môi giới chuyên nghiệp</span>
                      </Link>
                    </div>
                  </div>
                )}
              </li>
              
              <li><Link to="/du-an">Dự án</Link></li>
              <li><Link to="/tin-tuc">Tin tức</Link></li>
              <li><Link to="/membership">Pro</Link></li>
            </ul>
          </nav>
        </div>
        
        
        
        <div className="user-actions">
          <NotificationBell />
          <Link 
            to="/dang-tin" 
            className="post-button"
            onClick={handlePostClick}
          >
            Đăng tin
          </Link>
          
          {user ? (
            <div className="user-menu">
              <button className="user-menu-button">
                <img src={`http://localhost:5134/${user?.avatarUrl || 'default-avatar.png'}`} alt="Avatar" className="user-avatar" />
                <span>{user.name}</span>
              </button>
              
              <div className="user-dropdown">
                <Link to="/profile">Tài khoản của tôi</Link>
                <Link to="/chat">Tin nhắn</Link>
                {/* Sử dụng agentProfile state local */}
                {agentProfile ? (
                  <Link to={`/agent-profile/${agentProfile.id}`}>
                    
                    Chuyên trang môi giới
                  </Link>
                ) : null}
                <Link to="/favorites">Tin đã thích</Link>
                {user.role?.toLowerCase() === 'admin' && <Link to="/admin">Quản trị</Link>}
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-button">Đăng nhập</Link>
            </>
          )}
        </div>

        
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <img src="https://s3-cdn.rever.vn/p/v2.48.50/images/logo.svg" alt="Logo" className="mobile-logo" />
            <button 
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              <li className="mobile-nav-item"><Link to="/Sale" className="mobile-nav-link">Mua bán</Link></li>
              <li className="mobile-nav-item"><Link to="/Rent" className="mobile-nav-link">Cho thuê</Link></li>
              <li className="mobile-nav-item"><Link to="/agent-profile" className="mobile-nav-link">Môi giới</Link></li>
              <li className="mobile-nav-item"><Link to="/du-an" className="mobile-nav-link">Dự án</Link></li>
              <li className="mobile-nav-item"><Link to="/tin-tuc" className="mobile-nav-link">Tin tức</Link></li>
            </ul>
          </nav>
          <div className="mobile-actions">
            {user ? (
              <>
                <Link to="/profile" className="btn btn-outline-primary w-100 mb-2">Tài khoản</Link>
                <button onClick={handleLogout} className="btn btn-primary w-100">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary w-100 mb-2">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary w-100">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 