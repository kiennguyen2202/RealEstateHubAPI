import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import axiosClient from '../api/axiosClient';
import './HomePage.css';
import { href, useNavigate } from 'react-router-dom';
import { toTrieu } from '../utils/priceUtils';
import axiosPrivate from '../api/axiosPrivate';
import PopupMembership from '../components/PopupMembership';
import { isProRole } from '../utils/roleUtils';

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
  const [searchFilters, setSearchFilters] = useState({
    propertyType: '',
    location: '',
    priceRange: ''
  });
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
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [searchPropertyType, setSearchPropertyType] = useState('');
  const [searchCityId, setSearchCityId] = useState('');
  const [searchPriceRange, setSearchPriceRange] = useState('');

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
        axiosClient.get('/api/posts?isApproved=true&limit=8'),
        axiosClient.get('/api/categories'),
        axiosPrivate.get('/api/areas/cities') // Fetch cities
      ]);
      
      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setFilteredProperties(propertiesRes.data);
        // Set featured properties (first 6 approved posts)
        setFeaturedProperties(propertiesRes.data.slice(0, 6));
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
        const isSaleProp = property.transactionType === 'Sale' || property.transactionType === 0 || property.transactionType === TransactionType.Sale;
        const isRentProp = property.transactionType === 'Rent' || property.transactionType === 1 || property.transactionType === TransactionType.Rent;
        if (filters.transaction === 'sale') return isSaleProp;
        if (filters.transaction === 'rent') return isRentProp;
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
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Tìm ngôi nhà <span className="hero-title-highlight">hoàn hảo</span><br />
            cho gia đình bạn
          </h1>
          
          <p className="hero-subtitle">
            Hơn 177,000+ tin đăng bất động sản từ chủ nhà và môi giới uy tín
          </p>

          {/* Search Form */}
          <div className="search-box">
            <div className="search-form">
              <div className="search-input-group">
                
                {/* Property Type */}
                <div className="search-field">
                  <label className="search-label">Loại bất động sản</label>
                  <select className="search-select" value={searchPropertyType} onChange={(e) => setSearchPropertyType(e.target.value)}>
                    <option value="">Chọn loại BĐS</option>
                    <option value="apartment">Chung cư</option>
                    <option value="house">Nhà riêng</option>
                    <option value="land">Đất nền</option>
                    <option value="office">Văn phòng</option>
                  </select>
                </div>

                {/* Location */}
                <div className="search-field">
                  <label className="search-label">Khu vực</label>
                  <select className="search-select" value={searchCityId} onChange={(e) => setSearchCityId(e.target.value)}>
                    <option value="">Chọn khu vực</option>
                    {uniqueCities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="search-field">
                  <label className="search-label">Mức giá</label>
                  <select className="search-select" value={searchPriceRange} onChange={(e) => setSearchPriceRange(e.target.value)}>
                    <option value="">Chọn mức giá</option>
                    <option value="0-1000">Dưới 1 tỷ</option>
                    <option value="1000-3000">1 - 3 tỷ</option>
                    <option value="3000-5000">3 - 5 tỷ</option>
                    <option value="5000+">Trên 5 tỷ</option>
                  </select>
                </div>

                {/* Search Button */}
                <button className="search-btn" onClick={() => {
                  const params = new URLSearchParams();
                  if (searchPropertyType) params.set('category', searchPropertyType);
                  if (searchCityId) params.set('cityId', searchCityId);
                  if (searchPriceRange) params.set('priceRange', searchPriceRange);
                  const qs = params.toString();
                  navigate(qs ? `/posts?${qs}` : '/posts');
                }}>
                  <i className="fas fa-search"></i>
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section section">
        <div className="section-header">
          <h2 className="section-title">
            Tại sao chọn <span className="section-title-highlight">RealEstateHub</span>?
          </h2>
          <p className="section-subtitle">
            Chúng tôi mang đến trải nghiệm tìm kiếm bất động sản tốt nhất với những ưu điểm vượt trội
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <i className="fas fa-shield-alt feature-icon"></i>
            </div>
            <h3 className="feature-title">Thông tin minh bạch</h3>
            <p className="feature-desc">
              Tất cả thông tin BĐS được xác thực, đảm bảo độ tin cậy cao
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <i className="fas fa-users feature-icon"></i>
            </div>
            <h3 className="feature-title">Hỗ trợ tận tình</h3>
            <p className="feature-desc">
              Đội ngũ chuyên viên giàu kinh nghiệm hỗ trợ 24/7
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <i className="fas fa-award feature-icon"></i>
            </div>
            <h3 className="feature-title">Uy tín hàng đầu</h3>
            <p className="feature-desc">
              Được tin tưởng bởi hàng triệu khách hàng trên toàn quốc
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <i className="fas fa-clock feature-icon"></i>
            </div>
            <h3 className="feature-title">Tiết kiệm thời gian</h3>
            <p className="feature-desc">
              Công nghệ AI giúp tìm kiếm và gợi ý BĐS phù hợp nhanh chóng
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="featured-properties section">
        <div className="section-header">
          <h2 className="section-title">
            Bất động sản <span className="section-title-highlight">nổi bật</span>
          </h2>
          <p className="section-subtitle">
            Khám phá những bất động sản được quan tâm nhiều nhất
          </p>
        </div>
        
        <div className="property-grid">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : featuredProperties.length === 0 ? (
            <div className="no-data">Không có bất động sản nào</div>
          ) : (
            featuredProperties
              .sort((a, b) => {
                const aIsPro = isProRole(a.user?.role) ? 1 : 0;
                const bIsPro = isProRole(b.user?.role) ? 1 : 0;
                return bIsPro - aIsPro;
              })
              .map(property => (
                <PropertyCard key={property.id} property={property} />
              ))
          )}
        </div>
        
        <div className="text-center mt-4">
          <a href="/posts" className="btn btn-outline-primary">Xem thêm bất động sản</a>
        </div>
      </section>

      

      {/* Projects Section */}
      <section className="projects-section section">
        <div className="section-header">
          <h2 className="section-title">
            Dự án <span className="section-title-highlight">nổi bật</span>
          </h2>
          <p className="section-subtitle">
            Khám phá các dự án bất động sản hot nhất hiện tại với mức giá hấp dẫn
          </p>
        </div>
        
        <div className="projects-grid">
          <a className="project-card" href="/du-an">
            <div className="project-image">
              <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Dự án nổi bật" />
              <span className="project-status status-active">Nổi bật</span>
            </div>
            <div className="project-content">
              <h3 className="project-title">Xem dự án nổi bật</h3>
              <div className="project-details">
                <div className="project-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>TP.HCM & Toàn quốc</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{color: 'white', fontSize: '2.5rem'}}>
              Con số ấn tượng
            </h2>
            <p className="section-subtitle" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
              Những thành tựu đáng tự hào của RealEstateHub trong việc phục vụ khách hàng
            </p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">177K+</div>
              <div className="stat-label">
                <div>Tin đăng bất động sản</div>
                <div>Được cập nhật liên tục</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">
                <div>Khách hàng tin tưởng</div>
                <div>Trên toàn quốc</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">
                <div>Dự án hot</div>
                <div>Đang mở bán</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">
                <div>Hỗ trợ khách hàng</div>
                <div>Tư vấn miễn phí</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section section">
        <div className="section-header">
          <h2 className="section-title">
            Tin tức <span className="section-title-highlight">bất động sản</span>
          </h2>
          <p className="section-subtitle">
            Cập nhật những thông tin mới nhất về thị trường BĐS và các dự án hot
          </p>
        </div>
        <div className="news-grid">
          <a className="news-card" href="/tin-tuc">
            <div className="news-image">
              <img src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Tin tức BĐS" />
              <span className="news-category">Tin tức</span>
            </div>
            <div className="news-content">
              <h3 className="news-title">Xem tin tức mới nhất</h3>
              <p className="news-excerpt">Cập nhật thị trường, dự án, hướng dẫn mua bán</p>
            </div>
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section section" style={{backgroundColor: 'black'}}>
        <div className="section-header">
          <h2 className="section-title">Dịch vụ của RealEstateHub</h2>
          <p className="section-subtitle">
            Chúng tôi cung cấp đầy đủ các dịch vụ bất động sản chuyên nghiệp
          </p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <i className="fas fa-home service-icon" />
            <h3 className="service-title">Mua bán nhà đất</h3>
            <p className="service-desc">
              Tìm kiếm và giao dịch bất động sản nhanh chóng, an toàn.
            </p>
          </div>
          <div className="service-card">
            <i className="fas fa-key service-icon" />
            <h3 className="service-title">Cho thuê bất động sản</h3>
            <p className="service-desc">
              Quy trình chuyên nghiệp, minh bạch và hiệu quả.
            </p>
          </div>
          <div className="service-card">
            <i className="fas fa-chart-line service-icon" />
            <h3 className="service-title">Đầu tư bất động sản</h3>
            <p className="service-desc">
              Tư vấn sinh lời với phân tích thị trường chuyên sâu.
            </p>
          </div>
          <div className="service-card">
            <i className="fas fa-file-contract service-icon" />
            <h3 className="service-title">Pháp lý bất động sản</h3>
            <p className="service-desc">
              Hỗ trợ thủ tục pháp lý và giấy tờ liên quan giao dịch.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section section">
        <div className="section-header">
          <h2 className="section-title">Khách hàng nói gì</h2>
          <p className="section-subtitle">
            Những đánh giá từ khách hàng đã sử dụng dịch vụ
          </p>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">
              "Dịch vụ chuyên nghiệp, tôi tìm được căn nhà ưng ý rất nhanh! Nhân viên tư vấn rất nhiệt tình và am hiểu thị trường."
            </p>
            <div className="testimonial-author">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                alt="Nguyễn Văn An"
              />
              <div>
                <h4>Nguyễn Văn An</h4>
                <p>Chủ hộ gia đình</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-text">
              "RealEstateHub giúp tôi đầu tư bất động sản hiệu quả. Thông tin dự án chi tiết và chính xác, rất đáng tin cậy."
            </p>
            <div className="testimonial-author">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                alt="Trần Thị Bình"
              />
              <div>
                <h4>Trần Thị Bình</h4>
                <p>Nhà đầu tư</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-text">
              "Quy trình thuê nhà rất đơn giản và nhanh chóng. Tôi đã tìm được căn hộ phù hợp với ngân sách chỉ trong 1 tuần."
            </p>
            <div className="testimonial-author">
              <img
                src="https://avatars.steamstatic.com/4321f8b0cdfceb00367ecd3a12311282b92b0884_full.jpg"
                alt="Lê Minh Cường"
              />
              <div>
                <h4>Lê Minh Cường</h4>
                <p>Nhân viên văn phòng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {showPopup && <PopupMembership onClose={handleClosePopup} />}
    </div>
  );
};

export default HomePage;