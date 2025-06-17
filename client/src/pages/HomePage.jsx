import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import MessagingFeature from '../components/Message/MessagingFeature';
import axiosClient from '../api/axiosClient';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import { toTrieu } from '../utils/priceUtils';
import axiosPrivate from '../api/axiosPrivate';

const TransactionType = {
  Sale: 0, 
  Rent: 1  
};

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uniqueCities, setUniqueCities] = useState([]);
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
      
      // Fetch properties, categories, and cities
      const [propertiesRes, categoriesRes, citiesRes] = await Promise.all([
        axiosClient.get('/api/posts?isApproved=true'),
        axiosClient.get('/api/categories'),
        axiosPrivate.get('/api/areas/cities') // Fetch cities
      ]);
      
      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setFilteredProperties(propertiesRes.data);
      }
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (citiesRes.data) {
        setUniqueCities(citiesRes.data);
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

    // Lọc theo khu vực (cityId)
    if (filters.area) {
      filtered = filtered.filter(property => 
        property.area?.cityId === parseInt(filters.area) // Filter by cityId
      );
    }

    // Lọc theo khoảng giá
    if (filters.priceRange) {
  let min = 0, max = Infinity;
  if (filters.priceRange.includes('-')) {
    [min, max] = filters.priceRange.split('-').map(Number);
  } else if (filters.priceRange.endsWith('+')) {
    min = Number(filters.priceRange.replace('+', ''));
    max = Infinity;
  }
  filtered = filtered.filter(property => {
    const priceTrieu = toTrieu(property.price, property.priceUnit);
    return priceTrieu >= min && priceTrieu <= max;
  });
}

    // Sắp xếp
    switch (filters.sortBy) {
      case 'price-asc':
    filtered.sort((a, b) =>
      toTrieu(a.price, a.priceUnit) - toTrieu(b.price, b.priceUnit)
    );
    break;
  case 'price-desc':
    filtered.sort((a, b) =>
      toTrieu(b.price, b.priceUnit) - toTrieu(a.price, a.priceUnit)
    );
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
              {uniqueCities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
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