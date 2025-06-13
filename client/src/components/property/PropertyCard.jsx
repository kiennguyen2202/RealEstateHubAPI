import React from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';
import { PriceUnit, formatPrice } from '../../utils/priceUtils';
import FavoriteButton from '../Favorite/FavoriteButton';


// Định nghĩa enum PriceUnit tương tự như ở backend


const PropertyCard = ({ property,showFavorite = true }) => {
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

  return (
    <div className="property-card">
      <Link to={`/chi-tiet/${property.id}`} className="property-link">
        <div className="property-image">
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

          <h3 className="property-title">{property.title}</h3>
          
          <div className="property-price">
            {formatPrice(property.price, property.priceUnit)}
          </div>
          
          <div className="property-details">
            <span>{property.area_Size}m²</span>
            <span>{property.category?.name || 'Chưa phân loại'}</span>
            <span>{property.area ? `${property.area.city}` : 'Chưa có khu vực'}</span>
          </div>
          
          <div className="property-meta">
            <span className="post-date">{new Date(property.created).toLocaleDateString('vi-VN')}</span>
            <span className={`transaction-type ${property.transactionType === 0 ? 'sale' : 'rent'}`}>
              {property.transactionType === 0 ? "Mua bán" : "Cho thuê"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard; 