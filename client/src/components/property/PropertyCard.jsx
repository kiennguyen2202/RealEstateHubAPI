import React from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

const PropertyCard = ({ property }) => {
  // Helper function để format giá
  const formatPrice = (price, unit) => {
    if (!price || price === 0) return 'Thỏa thuận';
  
    if (unit === PriceUnit.Tỷ) {
      return `${price} tỷ`;
    } else if (unit === PriceUnit.Triệu) {
      return `${price} triệu`;
    }
  
    // Nếu không có đơn vị thì fallback về định dạng theo giá trị VND
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    }
    return `${(price / 1_000_000).toFixed(0)} triệu`;
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
            src={getFullImageUrl(property.images && property.images.length > 0 ? property.images[0].url : null)}
            alt={property.title} 
          />
          {property.status === 'active' && <span className="verified-badge">Đang hiển thị</span>}
        </div>
        
        <div className="property-info">
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
            <span className="transaction-type">{property.transactionType === 'Sale' ? 'Mua bán' : 'Cho thuê'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard; 