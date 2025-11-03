import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h3 className="newsletter-title">
              Đăng ký nhận tin tức bất động sản
            </h3>
            <p className="newsletter-subtitle">
              Cập nhật những thông tin mới nhất về thị trường BĐS và các dự án hot
            </p>
            
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                <i className="fas fa-envelope"></i>
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-column">
              <div className="footer-logo">RealEstateHub</div>
              <p className="footer-description">
                Nền tảng bất động sản hàng đầu Việt Nam, kết nối người mua, người bán và các chuyên gia BĐS.
              </p>
              
              {/* Social Links */}
              <div className="social-links">
                <a href="#" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="footer-title">Liên kết nhanh</h4>
              <ul className="footer-links">
                <li><Link to="/Sale" className="footer-link">Mua nhà</Link></li>
                <li><Link to="/Rent" className="footer-link">Thuê nhà</Link></li>
                <li><Link to="/du-an" className="footer-link">Dự án</Link></li>
                <li><Link to="/tin-tuc" className="footer-link">Tin tức</Link></li>
                <li><Link to="/wiki" className="footer-link">Wiki BĐS</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="footer-column">
              <h4 className="footer-title">Dịch vụ</h4>
              <ul className="footer-links">
                <li><Link to="/dang-tin" className="footer-link">Đăng tin BĐS</Link></li>
                <li><a href="#" className="footer-link">Thẩm định giá</a></li>
                <li><a href="#" className="footer-link">Tư vấn đầu tư</a></li>
                <li><a href="#" className="footer-link">Hỗ trợ pháp lý</a></li>
                <li><a href="#" className="footer-link">Vay mua nhà</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-column">
              <h4 className="footer-title">Liên hệ</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <i className="fas fa-map-marker-alt contact-icon"></i>
                  <span>123 Nguyễn Huệ, Q1, TP.HCM</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone contact-icon"></i>
                  <span>1900 1234</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-envelope contact-icon"></i>
                  <span>contact@realestatehub.vn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 RealEstateHub. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">
                Điều khoản sử dụng
              </a>
              <a href="#" className="footer-bottom-link">
                Chính sách bảo mật
              </a>
              <a href="#" className="footer-bottom-link">
                Quy chế hoạt động
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;