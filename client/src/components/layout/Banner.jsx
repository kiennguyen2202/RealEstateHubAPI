import React from 'react';
import './Banner.css';

const Banner = () => {
  return (
    <div className="main-banner">
      <div className="banner-content">
        <div className="banner-title">
          <span className="banner-highlight">PHÒNG VỪA Ý</span>
          <span className="banner-desc">Giá hợp lý</span>
        </div>
        <div className="banner-info">
          <span className="banner-time">13:00 - 15:00</span>
          <span className="banner-date">18 & 20/6</span>
        </div>
        <div className="banner-social">
          <i className="fab fa-facebook-square"></i>
          <i className="fab fa-tiktok"></i>
          <i className="fab fa-youtube"></i>
        </div>
      </div>
      <div className="banner-image">
        <img src="/public/real-estate-logo-house-logo-home-logo-sign-symbol-free-vector.jpg" alt="Banner" />
      </div>
    </div>
  );
};

export default Banner; 