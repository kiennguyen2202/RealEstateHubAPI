import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import axiosClient from '../api/axiosClient';
import './HomePage.css';

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    area: '',
    priceRange: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      // Sử dụng endpoint /posts khi không có filter
      const endpoint = '/api/posts';
      
      const response = await axiosClient.get(endpoint, {
        params: Object.values(filters).some(value => value) ? filters : {}
      });
      
      if (response.data) {
        setProperties(response.data);
      } else {
        setError('Không có dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Không thể tải danh sách bất động sản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="search-section">
        <div className="search-container">
          <h1>Tìm kiếm bất động sản</h1>
          <div className="search-filters">
            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">Loại bất động sản</option>
              <option value="apartment">Căn hộ chung cư</option>
              <option value="house">Nhà riêng</option>
              <option value="land">Đất</option>
              <option value="commercial">Văn phòng, mặt bằng</option>
            </select>

            <select 
              value={filters.area}
              onChange={(e) => setFilters({...filters, area: e.target.value})}
            >
              <option value="">Khu vực</option>
              <option value="hcm">TP.HCM</option>
              <option value="hn">Hà Nội</option>
              <option value="dn">Đà Nẵng</option>
            </select>

            <select 
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
            >
              <option value="">Khoảng giá</option>
              <option value="0-500">Dưới 500 triệu</option>
              <option value="500-1000">500 - 1 tỷ</option>
              <option value="1000-2000">1 - 2 tỷ</option>
              <option value="2000+">Trên 2 tỷ</option>
            </select>

            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      <div className="properties-section">
        <div className="properties-container">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="properties-grid">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 