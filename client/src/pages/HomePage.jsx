import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import axiosClient from '../api/axiosClient';
import './HomePage.css';

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',        // Loại hình BĐS (từ backend)
    transaction: '',     // Phương thức giao dịch (mua/bán hoặc cho thuê)
    area: '',           // Khu vực
    priceRange: '',     // Khoảng giá
    sortBy: 'newest'    // Sắp xếp
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
            {/* Phương thức giao dịch */}
            <select 
              value={filters.transaction}
              onChange={(e) => setFilters({...filters, transaction: e.target.value})}
            >
              <option value="">Phương thức giao dịch</option>
              <option value="sale">Mua bán</option>
              <option value="rent">Cho thuê</option>
            </select>

            {/* Loại hình BĐS */}
            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">Loại hình BĐS</option>
              <option value="apartment">Căn hộ chung cư</option>
              <option value="house">Nhà riêng</option>
              <option value="land">Đất nền</option>
              <option value="commercial">Văn phòng, mặt bằng</option>
            </select>

            {/* Khu vực */}
            <select 
              value={filters.area}
              onChange={(e) => setFilters({...filters, area: e.target.value})}
            >
              <option value="">Khu vực</option>
              <option value="hcm">TP.HCM</option>
              <option value="hn">Hà Nội</option>
              <option value="dn">Đà Nẵng</option>
              <option value="ct">Cần Thơ</option>
              <option value="hp">Hải Phòng</option>
            </select>

            {/* Khoảng giá */}
            <select 
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
            >
              <option value="">Khoảng giá</option>
              <option value="0-500">Dưới 500 triệu</option>
              <option value="500-1000">500 - 1 tỷ</option>
              <option value="1000-2000">1 - 2 tỷ</option>
              <option value="2000-5000">2 - 5 tỷ</option>
              <option value="5000+">Trên 5 tỷ</option>
            </select>

            {/* Sắp xếp */}
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="area-asc">Diện tích tăng dần</option>
              <option value="area-desc">Diện tích giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      <div className="properties-section">
        <div className="properties-container">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : properties.length === 0 ? (
            <div className="no-data">Không có bất động sản nào</div>
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