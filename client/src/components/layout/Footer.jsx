import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section about">
          <h3>Real Estate Hub</h3>
          <p>
            Nền tảng kết nối người mua và người bán bất động sản uy tín hàng đầu Việt Nam.
            Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho khách hàng.
          </p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-section links">
          <h3>Liên kết nhanh</h3>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/tim-kiem">Tìm kiếm</Link></li>
            <li><Link to="/dang-tin">Đăng tin</Link></li>
            <li><Link to="/tin-tuc">Tin tức</Link></li>
            <li><Link to="/lien-he">Liên hệ</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>Liên hệ</h3>
          <div className="contact-info">
            <p>
              <FaPhone className="icon" />
              <span>Hotline: 1900 1234</span>
            </p>
            <p>
              <FaEnvelope className="icon" />
              <span>Email: support@realestatehub.com</span>
            </p>
            <p>
              <FaMapMarkerAlt className="icon" />
              <span>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Real Estate Hub. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer;