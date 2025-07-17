import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';
import { PriceUnit, formatPrice } from '../../utils/priceUtils';
import FavoriteButton from '../Favorite/FavoriteButton';
import { FaCrown } from 'react-icons/fa';

const PropertyCard = ({ property,showFavorite = true }) => {
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
    if (!imageUrl) return '/upload.jpg'; // Placeholder nếu không có ảnh
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:5134${imageUrl}`;
  };

  // Check expired status (show expired badge if the property is expired)
  const isExpired = property.expiryDate && new Date(property.expiryDate) < new Date();
  const expiredDate = property.expiryDate ? new Date(property.expiryDate) : null;
  const now = new Date();
  const showExpiredBadge = isExpired && expiredDate && (now - expiredDate <= 24 * 60 * 60 * 1000);

  return (
    <div className={`property-card${property.user?.role === 'Membership' ? ' membership-card' : ''}${showExpiredBadge ? ' expired' : ''}`}>
      <Link
        to={showExpiredBadge ? '#' : `/chi-tiet/${property.id}`}
        className="property-link"
        onClick={e => {
          if (showExpiredBadge) {
            e.preventDefault();
            setShowExpiredAlert(true);
          }
        }}
      >
        <div className="property-image" style={{position: 'relative'}}>
          {/* Expired Badge */}
          {showExpiredBadge && (
            <div className="expired-badge">Tin hết hạn</div>
          )}
          {/* Pro Badge */}
          {property.user?.role === 'Membership' && (
            <div className="pro-badge">
              <FaCrown className="pro-crown-icon" />
              Pro
            </div>
          )}
          <img 
            src={getFullImageUrl(getFirstImageUrl(property.images))}
            alt={property.title} 
          />
          {showFavorite && (
            <div className="favorite-button-container">
              <FavoriteButton postId={property.id} />
            </div>
          )}
        </div>
        
        <div className="property-info">
          <div className="user-info">
            <img 
              src={getFullImageUrl(property.user?.avatarUrl)} 
              alt={property.user?.name || 'User'} 
              className="user-avatar"
            />
            <span className="user-name">{property.user?.name || 'Người dùng'}</span>
          </div>

          <h3 className="property-title1">{property.title}</h3>
          
          <div className="property-price">
            {formatPrice(property.price, property.priceUnit)}
          </div>
          
          <div className="property-details">
            <span>{property.area_Size}m²</span>
            <span>{property.category?.name || 'Chưa phân loại'}</span>
            <span>{property.area ? `${property.area.city?.name}` : 'Chưa có khu vực'}</span>
          </div>

          {property.soPhongNgu != null && property.soPhongNgu !== '' && (
            <div className="property-bedrooms">
              <span className="bedrooms">
                <i className="fas fa-bed"></i> {property.soPhongNgu} Phòng ngủ
              </span>
            </div>
          )}
          {property.soPhongTam != null && property.soPhongTam !== '' && (
            <div className="property-bathrooms">
              <span className="bathrooms">
                <i className="fas fa-bath"></i> {property.soPhongTam} Phòng tắm
              </span>
            </div>
          )}
          <div className="property-meta">
            <span className="post-date">{new Date(property.created).toLocaleDateString('vi-VN')}</span>
            <span className={`transaction-type ${property.transactionType === 0 ? 'sale' : 'rent'}`}>
              {property.transactionType === 0 ? "Mua bán" : "Cho thuê"}
            </span>
          </div>
        </div>
      </Link>
      {showExpiredAlert && (
        <div className="expired-popup">
          Tin đã hết hạn, vui lòng xem tin khác
          <button onClick={() => setShowExpiredAlert(false)}>Đóng</button>
        </div>
      )}
    </div>
  );
};

export default PropertyCard; 