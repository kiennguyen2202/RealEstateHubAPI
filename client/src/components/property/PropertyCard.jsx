import React from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

const PropertyCard = ({ property }) => {
  // Helper function để hiển thị đơn vị giá từ enum
  const displayPriceUnit = (unitValue) => {
    switch (unitValue) {
      case PriceUnit.Tỷ:
        return 'tỷ';
      case PriceUnit.Triệu:
        return 'triệu';
      default:
        return '';
    }
  };

  // Helper function để lấy URL đầy đủ của ảnh
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return '/upload.jpg'; // Placeholder nếu không có ảnh
    // Giả sử backend serve static files tại http://localhost:5134
    // Bạn có thể cần điều chỉnh URL này nếu backend chạy ở địa chỉ/port khác
    const backendBaseUrl = 'http://localhost:5134';
    // Kiểm tra nếu URL đã là đầy đủ (ví dụ từ nguồn ngoài)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Kết hợp base URL của backend với đường dẫn tương đối từ API
    return `${backendBaseUrl}${imageUrl}`;
  };

  return (
    <div className="property-card">
      <Link to={`/chi-tiet/${property.id}`} className="property-link">
        <div className="property-image">
          <img 
            src={getFullImageUrl(property.images && property.images.length > 0 ? property.images[0].url : property.imageURL)}
            alt={property.title} 
          />
          {property.status === 'verified' && <span className="verified-badge">Đã xác thực</span>}
        </div>
        
        <div className="property-info">
          <h3 className="property-title">{property.title}</h3>
          
          <div className="property-price">
            {property.price} {displayPriceUnit(property.priceUnit)}
          </div>
          
          <div className="property-details">
            <span>{property.area_Size}m²</span>
            <span>{property.category?.name || 'Chưa phân loại'}</span>
            <span>{property.area ? `${property.area.city}` : 'Chưa có khu vực'}</span>
          </div>
          
          
          
          <div className="property-meta">
            <span className="post-date">{new Date(property.created).toLocaleDateString('vi-VN')}</span>
            <span className="status">{property.status}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard; 