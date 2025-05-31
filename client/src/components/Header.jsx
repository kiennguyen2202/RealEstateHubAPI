import React from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, useAuth } from '../auth/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          Real Estate Hub
        </Link>
        <nav className="nav-menu">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/tim-kiem" className="nav-link">Tìm kiếm</Link>
          {user ? (
            <>
              <Link to="/dang-tin" className="nav-link">Đăng tin</Link>
              <Link to="/quan-ly-tin" className="nav-link">Quản lý tin</Link>
              <Link to="/profile" className="nav-link">Tài khoản</Link>
              <button onClick={logout} className="nav-link logout-btn">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Đăng nhập</Link>
              <Link to="/register" className="nav-link">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 