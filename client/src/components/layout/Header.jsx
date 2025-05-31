import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <img src="/logo.png" alt="Real Estate Hub" />
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li><Link to="/mua-ban">Mua bán</Link></li>
            <li><Link to="/cho-thue">Cho thuê</Link></li>
            <li><Link to="/du-an">Dự án</Link></li>
            <li><Link to="/tin-tuc">Tin tức</Link></li>
          </ul>
        </nav>

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
                <img src={user.avatar || '/default-avatar.png'} alt="Avatar" className="user-avatar" />
                <span>{user.name}</span>
              </button>
              <div className="user-dropdown">
                <Link to="/profile">Tài khoản của tôi</Link>
                <Link to="/messages">Tin nhắn</Link>
                <Link to="/my-posts">Tin đã đăng</Link>
                {user.role === 'admin' && <Link to="/admin">Quản trị</Link>}
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-button">Đăng nhập</Link>
              <Link to="/register" className="register-button">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 