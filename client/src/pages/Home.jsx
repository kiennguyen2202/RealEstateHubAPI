import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import "./Home.css";
import axiosPrivate from "../api/axiosPrivate";


const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: "",
    areaId: "",
    minPrice: "",
    maxPrice: "",
    status: ""
  });
  const { user, logout, login, register } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, categoriesRes, areasRes] = await Promise.all([
          axiosClient.get("/api/posts"),
          axiosClient.get("/api/categories"),
          axiosClient.get("/api/areas")
        ]);
        setPosts(postsRes.data);
        setCategories(categoriesRes.data);
        setAreas(areasRes.data);
      } catch (err) {
        setError("Không thể tải dữ liệu");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(`/posts/search?${queryParams.toString()}`);
      setPosts(response.data);
    } catch (err) {
      setError("Không thể tìm kiếm bài viết");
      console.error("Error searching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", loginForm);
      login(res.data.user, res.data.token);
      setShowLoginModal(false);
      navigate("/");
    } catch {
      alert("Đăng nhập thất bại");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      return alert("Mật khẩu không khớp");
    }

    try {
      await axios.post("/auth/register", {
        email: registerForm.email,
        password: registerForm.password,
      });
      alert("Đăng ký thành công, hãy đăng nhập");
      setShowRegisterModal(false);
      navigate("/login");
    } catch (err) {
      alert("Đăng ký thất bại");
      console.error(err.response?.data || err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosPrivate.delete(`/posts/${postId}`);
        setPosts(posts.filter(p => p.id !== postId));
        alert("Xóa bài viết thành công!");
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Không thể xóa bài viết");
      }
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ===== Header ===== */}
      <header className="bg-white shadow px-6 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          {/* User + Đăng tin */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-800 font-medium">
                  <span>{user.name}</span>
                  
                    
                  
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-200 ease-in-out z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Trang cá nhân
                  </Link>
                  <Link to="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Tin nhắn
                  </Link>
                  {user.role === "Admin" && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => setShowLoginModal(true)} className="text-blue-600 hover:underline font-medium transition">
                  Đăng nhập
                </button>
                <button onClick={() => setShowRegisterModal(true)} className="text-blue-600 hover:underline font-medium transition">
                  Đăng ký
                </button>
              </div>
            )}

            <Link
              to={user ? "/create-post" : "/login"}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-md transition"
            >
              ĐĂNG TIN
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Danh sách bài đăng ===== */}
      <div className="home-container">
        <h2 className="home-title">Danh sách nhà đất tại TP.HCM</h2>
        <div className="post-grid">
          {posts.map((post) => (
            <div className="post-card" key={post.id}>
              <div className="post-image">
                <img
                  src={
                    post.images && post.images.length > 0
                      ? `http://localhost:5134${post.images[0].url}`
                      : "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt="Hình đại diện"
                />
              </div>
              <div className="post-info">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-price">
                  {Number(post.price).toLocaleString()} VNĐ
                </p>
                <p className="post-meta">
                  {post.area?.ward}, {post.area?.district}
                </p>
                <p className="post-meta">Diện tích: {post.area_Size} m²</p>
                <p className="post-date">
                  {new Date(post.created).toLocaleDateString("vi-VN")}
                </p>
                <div className="post-actions mt-4 flex justify-between gap-2">
                  <button
                    onClick={() => navigate(`/chi-tiet/${post.id}`)}
                    className="w-1/3 bg-blue-500 text-white text-center py-2 px-2 rounded hover:bg-blue-600 transition text-sm font-medium"
                  >
                    Xem chi tiết
                  </button>
                  {user && (user.id === post.userId || user.role === "Admin") && (
                    <>
                      <button
                        onClick={() => navigate(`/chi-tiet/${post.id}?edit=true`)}
                        className="w-1/3 bg-yellow-500 text-white text-center py-2 px-2 rounded hover:bg-yellow-600 transition text-sm font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="w-1/3 bg-red-500 text-white text-center py-2 px-2 rounded hover:bg-red-600 transition text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Đăng nhập */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 transform transition-all duration-300 ease-in-out">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Đăng nhập</h2>
            {/* Form đăng nhập */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input type="email" placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="password" placeholder="Mật khẩu" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">Đăng nhập</button>
            </form>
            <button onClick={() => setShowLoginModal(false)} className="mt-4 text-gray-500 hover:text-gray-700 transition">Đóng</button>
          </div>
        </div>
      )}

      {/* Modal Đăng ký */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 transform transition-all duration-300 ease-in-out">
            <h2 className="text-2xl font-bold mb-4 text-center text-green-600">Đăng ký</h2>
            {/* Form đăng ký */}
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <input type="text" placeholder="Tên" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="text" placeholder="Số điện thoại" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="email" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="password" placeholder="Mật khẩu" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="password" placeholder="Xác nhận mật khẩu" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
              <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">Đăng ký</button>
            </form>
            <button onClick={() => setShowRegisterModal(false)} className="mt-4 text-gray-500 hover:text-gray-700 transition">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;