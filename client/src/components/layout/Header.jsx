import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Header.css';
import { FaCrown } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');

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
        {(!user || (user && user.role?.toLowerCase() !== 'membership')) && (
          <button className="pro-header-btn" onClick={() => navigate('/membership')}>
            <FaCrown className="pro-crown-icon" />
            <span>Pro</span>
          </button>
        )}
        <div className="header-left">
          <div className="logo">
            <Link to="/" className="logo-link">
              <img src="/real-estate-logo-house-logo-home-logo-sign-symbol-free-vector.jpg" alt="Real Estate Hub" className="logo-img" />
              <span className="logo-text">RealEstateHub</span>
            </Link>
          </div>
          <nav className="main-nav">
            <ul>
              <li><Link to="/Sale">Mua bán</Link></li>
              <li><Link to="/Rent">Cho thuê</Link></li>
              <li><Link to="/du-an">Dự án</Link></li>
              <li><Link to="/tin-tuc">Tin tức</Link></li>
            </ul>
          </nav>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm bất động sản"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <span className="search-icon">
              <i className="fas fa-search"></i>
            </span>
          </button>
        </form>
        <div className="user-actions">
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
                <Link to="/messages">Tin nhắn</Link>
                <Link to="/post-history">Tin đã đăng</Link>
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
    </header>
  );
};

export default Header; 