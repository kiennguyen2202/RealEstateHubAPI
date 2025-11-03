import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import "./Home.css";
import axiosPrivate from "../api/axiosPrivate";
import PropertyCard from "../components/property/PropertyCard";
import { isProRole } from "../utils/roleUtils";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({
    transactionType: "Sale",
    categoryId: "",
    areaId: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "newest"
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [filters, posts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [postsRes, categoriesRes, areasRes] = await Promise.all([
        axiosClient.get("/api/posts?isApproved=true"),
        axiosClient.get("/api/categories"),
        axiosClient.get("/api/areas")
      ]);
      
      setPosts(postsRes.data);
      setFilteredPosts(postsRes.data);
      setCategories(categoriesRes.data);
      setAreas(areasRes.data);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...posts];

    // Filter by transaction type
    if (filters.transactionType) {
      filtered = filtered.filter(post => 
        post.transactionType === filters.transactionType || 
        post.transactionType === (filters.transactionType === "Sale" ? 0 : 1)
      );
    }

    // Filter by category
    if (filters.categoryId) {
      filtered = filtered.filter(post => post.categoryId === parseInt(filters.categoryId));
    }

    // Filter by area
    if (filters.areaId) {
      filtered = filtered.filter(post => post.areaId === parseInt(filters.areaId));
    }

    // Filter by price range
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(post => {
        const price = parseFloat(post.price);
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort posts
    switch (filters.sortBy) {
      case "price-asc":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-desc":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "area-asc":
        filtered.sort((a, b) => a.area_Size - b.area_Size);
        break;
      case "area-desc":
        filtered.sort((a, b) => b.area_Size - a.area_Size);
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
        break;
    }

    setFilteredPosts(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosPrivate.delete(`/api/posts/${postId}`);
        setPosts(posts.filter(p => p.id !== postId));
        alert("Xóa bài viết thành công!");
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Không thể xóa bài viết");
      }
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={fetchData} className="retry-btn">Thử lại</button>
    </div>
  );

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Tìm kiếm bất động sản <span className="hero-title-highlight">phù hợp</span>
          </h1>
          <p className="hero-subtitle">
            Khám phá hàng nghìn tin đăng bất động sản chất lượng cao
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">Loại giao dịch</label>
              <select 
                name="transactionType"
                value={filters.transactionType}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="Sale">Mua bán</option>
                <option value="Rent">Cho thuê</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Loại BĐS</label>
              <select 
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Tất cả loại</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Khu vực</label>
              <select 
                name="areaId"
                value={filters.areaId}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Tất cả khu vực</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.ward}, {area.district}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Giá từ</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Giá tối thiểu"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Giá đến</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Giá tối đa"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Sắp xếp</label>
              <select 
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="filter-select"
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
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="container">
          <div className="results-header">
            <h2 className="results-title">
              Kết quả tìm kiếm ({filteredPosts.length} bất động sản)
            </h2>
            {user && (
              <Link to="/dang-tin" className="post-btn">
                <i className="fas fa-plus"></i>
                Đăng tin mới
              </Link>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search no-results-icon"></i>
              <h3>Không tìm thấy bất động sản nào</h3>
              <p>Hãy thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          ) : (
            <div className="properties-grid">
              {filteredPosts
                .sort((a, b) => {
                  // Sort Pro users first (any Pro tier)
                  const aIsPro = isProRole(a.user?.role) ? 1 : 0;
                  const bIsPro = isProRole(b.user?.role) ? 1 : 0;
                  return bIsPro - aIsPro;
                })
                .map((post) => (
                  <PropertyCard key={post.id} property={post} />
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;