import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; //Sữa
import axiosClient from '../api/axiosClient';
import { useAuth } from "../auth/AuthContext";
import axiosPrivate from "../api/axiosPrivate";
import './PropertyDetailPage.css';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  {/* Thêm */}
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/posts/${id}`);
        setProperty(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="error">Lỗi: {error.message}</div>;
  }

  if (!property) {
    return <div className="not-found">Không tìm thấy bất động sản.</div>;
  }

  const displayPriceUnit = (unitValue) => {
    switch (unitValue) {
      case 0:
        return 'tỷ';
      case 1:
        return 'triệu';
      default:
        return '';
    }
  };

  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return '/upload.jpg';
    const backendBaseUrl = 'http://localhost:5134';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${backendBaseUrl}${imageUrl}`;
  };

  return (
    <div className="property-detail-page">
      <div className="property-detail-container">
        <div className="property-gallery">
          <div className="main-image">
            {property.images && property.images.length > 0 ? (
              <img src={getFullImageUrl(property.images[activeImage].url)} alt={property.title} />
            ) : property.imageURL ? (
              <img src={getFullImageUrl(property.imageURL)} alt={property.title} className="main-detail-image" />
            ) : (
              <img src="/upload.jpg" alt="Placeholder" className="main-detail-image" />
            )}
            <button className='report-button' onClick ={() => navigate(`/posts/${property.id}/report`)}>
              <i className="fas fa-flag"></i> Báo cáo
            </button>
            
          </div>
          <div className="thumbnail-list">
            {property.images.map((image, index) => (
              <div 
                key={index}
                className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={getFullImageUrl(image.url)} alt={`${property.title} - ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="property-info">
          <h1>{property.title}</h1>
          
          <div className="property-price">
            {property.price} {displayPriceUnit(property.priceUnit)}
          </div>

          <div className="property-meta">
            <div className="meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{property.street_Name}{property.area ? `, ${property.area.ward}, ${property.area.district}, ${property.area.city}` : ''}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-calendar"></i>
              <span>Đăng ngày: {new Date(property.created).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-eye"></i>
              <span>{property.views} lượt xem</span>
            </div>
          </div>

          <div className="property-details">
            <h2>Thông tin chi tiết</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Diện tích:</span>
                <span className="value">{property.area_Size}m²</span>
              </div>
              <div className="detail-item">
                <span className="label">Số phòng ngủ:</span>
                <span className="value">{property.bedrooms}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số phòng tắm:</span>
                <span className="value">{property.bathrooms}</span>
              </div>
              <div className="detail-item">
                <span className="label">Hướng nhà:</span>
                <span className="value">{property.direction}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số tầng:</span>
                <span className="value">{property.floors}</span>
              </div>
              <div className="detail-item">
                <span className="label">Nội thất:</span>
                <span className="value">{property.furniture}</span>
              </div>
            </div>
          </div>

          <div className="property-description">
            <h2>Mô tả</h2>
            <p>{property.description}</p>
          </div>

          <div className="property-contact">
            <h2>Thông tin liên hệ</h2>
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-user"></i>
                <span>{property.user.name}</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>{property.user.phone}</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>{property.user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage; 