import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosClient";

function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({
    keyword: "",
    categoryId: "",
    areaId: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    status: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, areasRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/areas")
        ]);
        setCategories(categoriesRes.data);
        setAreas(areasRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const searchPosts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        const response = await axios.get(`/api/posts/search?${queryParams.toString()}`);
        setPosts(response.data);
      } catch (err) {
        setError("Không thể tải danh sách bài viết");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    searchPosts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      keyword: "",
      categoryId: "",
      areaId: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
      status: ""
    });
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Bộ lọc */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Bộ lọc</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Từ khóa</label>
                  <input
                    type="text"
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tìm kiếm..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại bất động sản</label>
                  <select
                    name="categoryId"
                    value={filters.categoryId}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Khu vực</label>
                  <select
                    name="areaId"
                    value={filters.areaId}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.city} - {area.district} - {area.ward}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Khoảng giá (VNĐ)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Từ"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Đến"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Diện tích (m²)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minArea"
                      value={filters.minArea}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Từ"
                    />
                    <input
                      type="number"
                      name="maxArea"
                      value={filters.maxArea}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Đến"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="ForSale">Cần bán</option>
                    <option value="ForRent">Cho thuê</option>
                  </select>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách bài viết */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm ({posts.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    <img
                      src={
                        post.images && post.images.length > 0
                          ? `http://localhost:5134${post.images[0].url}`
                          : "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                      <p className="text-blue-600 font-bold mb-2">
                        {Number(post.price).toLocaleString()} VNĐ
                      </p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{post.area_Size} m²</span>
                        <span>{post.area?.ward}, {post.area?.district}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search; 