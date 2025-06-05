import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import MessagingFeature from '../components/Message/MessagingFeature';
import axiosClient from '../api/axiosClient';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';

const TransactionType = {
  Sale: 0, 
  Rent: 1  
};

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    transaction: '',     
    category: '',        
    area: '',         
    priceRange: '',     
    sortBy: 'newest'   
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [filters, properties]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch cả properties và categories
      const [propertiesRes, categoriesRes] = await Promise.all([
        axiosClient.get('/api/posts'),
        axiosClient.get('/api/categories')
      ]);
      
      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setFilteredProperties(propertiesRes.data);
      }
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Lọc theo phương thức giao dịch
    if (filters.transaction) {
      filtered = filtered.filter(property => {
        if (filters.transaction === 'sale') {
          return property.transactionType === TransactionType.Sale;
        } else if (filters.transaction === 'rent') {
          return property.transactionType === TransactionType.Rent;
        }
        return true;
      });
    }

    // Lọc theo loại hình BĐS
    if (filters.category) {
      filtered = filtered.filter(property => 
        property.categoryId === parseInt(filters.category)
      );
    }

    // Lọc theo khu vực
    if (filters.area) {
      filtered = filtered.filter(property => 
        property.area?.city.toLowerCase().includes(filters.area.toLowerCase())
      );
    }

    // Lọc theo khoảng giá
    if (filters.priceRange) {
      filtered = filtered.filter(property => {
        const price = property.price;
        const [min, max] = filters.priceRange.split('-').map(Number);
        
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }

    // Sắp xếp
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'area-asc':
        filtered.sort((a, b) => a.area_Size - b.area_Size);
        break;
      case 'area-desc':
        filtered.sort((a, b) => b.area_Size - a.area_Size);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
        break;
    }

    setFilteredProperties(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
          ) : filteredProperties.length === 0 ? (
            <div className="no-data">Không có bất động sản nào phù hợp với bộ lọc</div>
          ) : (
            <div className="properties-grid">
              {filteredProperties.map(property => (
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