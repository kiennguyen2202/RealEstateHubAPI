import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';
import { PriceUnit, formatPrice } from '../../utils/priceUtils';
import FavoriteButton from '../Favorite/FavoriteButton';

import { FaCrown, FaExclamationTriangle } from 'react-icons/fa';
import { isProRole } from '../../utils/roleUtils';

const PropertyCard = ({ property, showFavorite = true }) => {
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);

  const getFirstImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    if (typeof images[0] === 'object' && images[0] !== null && images[0].url)
      return images[0].url;
    if (typeof images[0] === 'string')
      return images[0];
    return null;
  };

  // Helper function để lấy URL đầy đủ của ảnh
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:5134${imageUrl}`;
  };

  // Helper function để hiển thị transaction type
  const getTransactionTypeText = (transactionType) => {
    if (!transactionType) return '';
    
    // Xử lý cả string và number
    if (typeof transactionType === 'string') {
      return transactionType === 'Sale' ? 'Mua bán' : 'Cho thuê';
    }
    
    if (typeof transactionType === 'number') {
      return transactionType === 0 ? 'Mua bán' : 'Cho thuê';
    }
    
    return '';
  };

  // Check expired status
  const isExpired = property?.expiryDate && new Date(property.expiryDate) < new Date();
  const expiredDate = property?.expiryDate ? new Date(property.expiryDate) : null;
  const now = new Date();
  const showExpiredBadge = isExpired && expiredDate && (now - expiredDate <= 24 * 60 * 60 * 1000);

  // Ensure property data exists
  if (!property) {
    return (
      <div className="project-card">
        <div className="project-image">
          <img 
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Default property" 
          />
        </div>
        <div className="project-content">
          <h3 className="project-title">Không có dữ liệu</h3>
          <div className="project-details">
            <div className="project-detail">
              <i className="fas fa-map-marker-alt"></i>
              <span>Không xác định</span>
            </div>
            <div className="project-detail">
              <i className="fas fa-home"></i>
              <span>Không xác định</span>
            </div>
          </div>
          <div className="project-price">
            <p className="price-label">Giá từ</p>
            <p className="price-value">Liên hệ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-card">
      <Link
        to={showExpiredBadge ? '#' : `/chi-tiet/${property.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
        onClick={e => {
          if (showExpiredBadge) {
            e.preventDefault();
            setShowExpiredAlert(true);
          }
        }}
      >
        <div className="property-image">
          <img 
            src={getFullImageUrl(getFirstImageUrl(property.images))}
            alt={property.title || 'Property image'} 
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
            }}
          />
          
          {/* Expired Badge - Ưu tiên cao nhất, hiển thị ở góc trái trên */}
          {showExpiredBadge && (
            <span className="property-status status-expired">
              Hết hạn
            </span>
          )}
          
          {/* Pro Badge - Chỉ hiện khi không hết hạn, hiển thị ở góc phải trên */}
          {!showExpiredBadge && isProRole(property.user?.role) && (
            <span className="property-status status-active pro-badge">
              <FaCrown style={{ marginRight: '4px' }} />
              Pro
            </span>
          )}
          
          {showFavorite && (
            <div className="favorite-button-container">
              <FavoriteButton postId={property.id} />
            </div>
          )}
        </div>
        
        <div className="property-content">
          <h3 className="property-title">{property.title || 'Không có tiêu đề'}</h3>
          
          <div className="property-details">
            {/* Hàng 1: Khu vực & Loại BĐS */}
            <div className="property-detail-row">
              <div className="property-detail">
                {property.area?.city?.name && (
                  <>
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{property.area.city.name}</span>
                  </>
                )}
              </div>
              <div className="property-detail">
                {property.category?.name && (
                  <>
                    <i className="fas fa-home"></i>
                    <span>{property.category.name}</span>
                  </>
                )}
              </div>
            </div>
            {/* Hàng 2: Diện tích & Số phòng ngủ */}
            <div className="property-detail-row">
              <div className="property-detail">
                {property.area_Size && (
                  <>
                    <i className="fas fa-ruler"></i>
                    <span>{property.area_Size} m²</span>
                  </>
                )}
              </div>
              <div className="property-detail">
                {property.soPhongNgu && (
                  <>
                    <i className="fas fa-bed"></i>
                    <span>{property.soPhongNgu} phòng ngủ</span>
                  </>
                )}
              </div>
            </div>
            {/* Hàng 3: Số phòng tắm & Số tầng */}
            <div className="property-detail-row">
              <div className="property-detail">
                {property.soPhongTam && (
                  <>
                    <i className="fas fa-bath"></i>
                    <span>{property.soPhongTam} phòng tắm</span>
                  </>
                )}
              </div>
              <div className="property-detail">
                {property.soTang && (
                  <>
                    <i className="fas fa-building"></i>
                    <span>{property.soTang} tầng</span>
                  </>
                )}
              </div>
            </div>
            {/* Hàng 4: Ngày đăng & (ô trống) */}
            <div className="property-detail-row">
              <div className="property-detail">
                {property.createdAt && (
                  <>
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(property.createdAt).toLocaleDateString('vi-VN')}</span>
                  </>
                )}
              </div>
              <div className="property-detail"></div>
            </div>
          </div>

          <div className="property-price">
            <div className="property-price-row">
              <div className="property-price-left">
                <span className="price-label">Giá từ</span>
                <span className="price-value">
                  {property.price ? formatPrice(property.price, property.priceUnit) : 'Liên hệ'}
                  {(property.transactionType === 'Rent' || property.transactionType === 1 || property.transactionType === '1') && (
                    <span className="price-period">/tháng</span>
                  )}
                </span>
              </div>
              <div className="property-price-right">
                <span className={`transaction-type ${
                  (property.transactionType === 'Sale' || property.transactionType === 0 || property.transactionType === '0') ? 'sale' : 'rent'
                }`}>
                  {(property.transactionType === 'Sale' || property.transactionType === 0 || property.transactionType === '0') ? "MUA BÁN" : "CHO THUÊ"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Alert khi bấm vào bất động sản đã hết hạn */}
      {showExpiredAlert && (
        <div
          className="expired-alert"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expired-title"
          aria-describedby="expired-desc"
        >
          <div
            className="expired-alert-backdrop"
            onClick={() => setShowExpiredAlert(false)}
          />
          <div className="expired-alert-content" role="document">
            <button
              className="expired-close"
              aria-label="Đóng thông báo"
              onClick={() => setShowExpiredAlert(false)}
            >
              ×
            </button>
            <div className="expired-header">
              <div className="expired-icon">
                <FaExclamationTriangle />
              </div>
              <h4 id="expired-title">Tin đăng đã hết hạn</h4>
              <p id="expired-desc">Bất động sản này đã hết hạn. Vui lòng xem các tin khác.</p>
            </div>
            <div className="expired-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowExpiredAlert(false)}
              >
                Đóng
              </button>
              <Link className="btn-primary" to="/posts">
                Xem tin khác
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;