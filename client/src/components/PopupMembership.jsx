import React from 'react';
import './PopupMembership.css';
import { useNavigate } from 'react-router-dom';
import { FaCrown } from 'react-icons/fa';

const PopupMembership = ({ onClose }) => {
  const navigate = useNavigate();

  const handleGoToMembership = () => {
    onClose();
    navigate('/membership');
  };

  return (
    <div className="popup-overlay">
      <div className="popup-membership animate-popup">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="popup-header">
          <FaCrown className="crown-icon" />
          <h2 className="popup-title">Ưu đãi thành viên Membership</h2>
        </div>
        <img
          src="../public/Gemini_Generated_Image_s5geo7s5geo7s5ge.png"
          className="popup-banner-illustration"
          style={{ background: '#fffbe6' }}
        />
        <div className="popup-benefits">
          <div className="benefit-item">🔓 Đăng tin không giới hạn</div>
          <div className="benefit-item">🚀 Ưu tiên hiển thị tin đăng</div>
          <div className="benefit-item">🎁 Nhận nhiều ưu đãi hấp dẫn</div>
          <div className="benefit-item">💬 Hỗ trợ khách hàng 24/7</div>
        </div>
        <p className="popup-desc">
          Trở thành thành viên <b>Membership</b> để trải nghiệm dịch vụ tốt nhất, tăng cơ hội bán/cho thuê bất động sản nhanh chóng như các sàn thương mại điện tử lớn!
        </p>
        <button className="membership-btn big-btn" onClick={handleGoToMembership}>
          Nâng cấp ngay
        </button>
      </div>
    </div>
  );
};

export default PopupMembership;
