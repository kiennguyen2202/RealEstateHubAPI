import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import MessagingFeature from '../components/Message/MessagingFeature';
import axiosClient from '../api/axiosClient';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import { toTrieu } from '../utils/priceUtils';
import axiosPrivate from '../api/axiosPrivate';
import HeroBanner from '../components/layout/HeroBanner';
import PopupMembership from '../components/PopupMembership';

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
    soPhongNgu: '',
    soPhongTam: '',     
    sortBy: 'newest'   
  });
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [filters, properties]);

  useEffect(() => {
    // Kiểm tra nếu đã từng đóng popup trong session này thì không hiện lại
    const hasClosed = sessionStorage.getItem('membershipPopupClosed');
    if (!hasClosed) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1000); // Hiện popup sau 3 giây
      return () => clearTimeout(timer);
    }
  }, []);

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
    //Lọc theo số lượng phòng ngủ
    if (filters.soPhongNgu) {
      filtered = filtered.filter(property => 
        property.soPhongNgu >= parseInt(filters.soPhongNgu)
      );
    }

    // Lọc theo số lượng phòng tắm
    if (filters.soPhongTam) {
      filtered = filtered.filter(property =>
        property.soPhongTam >= parseInt(filters.soPhongTam)
      );
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

  const handleClosePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('membershipPopupClosed', 'true');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <HeroBanner />
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

            {/* Số lượng phòng ngủ */}
            <select
              value={filters.soPhongNgu}
              onChange={(e) => setFilters({...filters, soPhongNgu: e.target.value})}
            >
              <option value="">Số lượng phòng ngủ</option>
              <option value="1">1 phòng</option>
              <option value="2">2 phòng</option>
              <option value="3">3 phòng</option>
              <option value="4">4 phòng</option>
              <option value="5">5 phòng</option>
            </select>
            {/* Số lượng phòng tắm */}
            <select
              value={filters.soPhongTam}
              onChange={(e) => setFilters({...filters, soPhongTam: e.target.value})}
            >
              <option value="">Số lượng phòng tắm</option>
              <option value="1">1 phòng</option>
              <option value="2">2 phòng</option>
              <option value="3">3 phòng</option>
              <option value="4">4 phòng</option>
              <option value="5">5 phòng</option>
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
              {filteredProperties
                .slice()
                .sort((a, b) => {
                  const aIsPro = a.user?.role === 'Membership' ? 1 : 0;
                  const bIsPro = b.user?.role === 'Membership' ? 1 : 0;
                  return bIsPro - aIsPro;
                })
                .map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
            </div>
          )}
        </div>
      </div>

      {showPopup && <PopupMembership onClose={handleClosePopup} />}
    </div>
  );
};

export default HomePage;