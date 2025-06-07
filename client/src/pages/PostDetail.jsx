import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import {
  FaHome, FaRuler, FaMapMarkerAlt, FaUser,
  FaPhone, FaEnvelope, FaEdit, FaTrash, FaExclamationTriangle,
  FaCommentDots
} from "react-icons/fa";
import "./PostDetail.css";
import { PriceUnit, formatPrice } from '../utils/priceUtils';
import ReportPost from "./ReportPost";

const TransactionType = {
  Sale: 0, 
  Rent: 1   
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    priceUnit: "",
    area_Size: "",
    street_Name: "",
    address: "",
    categoryId: "",
    areaId: "",
    transactionType: "",
    status: ""
  });
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, areasRes] = await Promise.all([
          axiosClient.get('/api/categories'),
          axiosClient.get('/api/areas')
        ]);
        setCategories(categoriesRes.data);
        setAreas(areasRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axiosClient.get(`/api/posts/${id}`);
        console.log('Fetched post data:', response.data);
        setPost(response.data);
        setEditForm({
          title: response.data.title,
          description: response.data.description,
          price: response.data.price,
          priceUnit: response.data.priceUnit,
          area_Size: response.data.area_Size,
          street_Name: response.data.street_Name,
          address: response.data.address,
          categoryId: response.data.categoryId,
          areaId: response.data.areaId,
          transactionType: response.data.transactionType,
          status: response.data.status
        });
      } catch (err) {
        setError("Không thể tải thông tin bài viết");
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setIsEditing(searchParams.get("edit") === "true");
  }, [location]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form data before submit:', editForm);

      const postData = {
        id: parseInt(id),
        title: editForm.title,
        description: editForm.description,
        price: parseFloat(editForm.price),
        priceUnit: parseInt(editForm.priceUnit),
        street_Name: editForm.street_Name,
        area_Size: parseFloat(editForm.area_Size),
        categoryId: parseInt(editForm.categoryId),
        areaId: parseInt(editForm.areaId),
        transactionType: parseInt(editForm.transactionType),
        userId: post.userId,
        status: 'active'
      };

      console.log('Data being sent to server:', postData);

      const response = await axiosClient.put(`/api/posts/${id}`, postData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Server response:', response.data);

      const updatedPost = await axiosClient.get(`/api/posts/${id}`);
      setPost(updatedPost.data);
      setIsEditing(false);
      navigate(`/chi-tiet/${id}`);
    } catch (err) {
      console.error('Error updating post:', err);
      if (err.response) {
        console.error('Error details:', err.response.data);
        alert(err.response.data.message || "Không thể cập nhật bài viết");
      } else {
        alert("Không thể cập nhật bài viết");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosClient.delete(`/api/posts/${id}`);
        navigate("/");
      } catch (err) {
        console.error(err);
        alert("Không thể xóa bài viết");
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <FaExclamationTriangle className="mr-2" />
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-message">
        <FaExclamationTriangle className="mr-2" />
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <div className="property-detail">
      {/* Header */}
      <div className="property-header">
        <div className="property-content">
          <h1 className="property-title">{post.title}</h1>
          <div className="property-meta">
            <div className="property-meta-item">
              <FaMapMarkerAlt />
              <span>{post.street_Name}, {post.area?.city}, {post.area?.ward}, {post.area?.district}</span>
            </div>
            <div className="property-meta-item">
              <FaRuler />
              <span>{post.area_Size} m²</span>
            </div>
            <div className="property-meta-item">
              <FaHome />
              <span>{post.category?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="property-content">
        <div className="property-grid">
          {/* Left Column - Images */}
          <div className="property-images">
            <img
              src={
                post.images && post.images.length > 0
                  ? `http://localhost:5134${post.images[selectedImage].url}`
                  : "https://via.placeholder.com/800x500?text=No+Image"
              }
              alt={post.title}
              className="main-image"
            />
            {post.images && post.images.length > 1 && (
              <div className="thumbnail-grid">
                {post.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? "selected" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={`http://localhost:5134${image.url}`}
                      alt={`${post.title} - ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <button className='report-button' onClick ={() => navigate(`/chi-tiet/${post.id}/report`)}>
              <i className="fas fa-flag"></i> Báo cáo
            </button>
          </div>

          {/* Right Column - Info */}
          <div className="property-info">
            <div className="price-tag">
              {formatPrice(post.price, post.priceUnit)}
            </div>
            <div className={`status-badge ${post.transactionType === 0 ? 'sale' : 'rent'}`}>
              {post.transactionType === 0 ? "Mua bán" : "Cho thuê"}
            </div>

            <div className="info-section">
              <h3>Thông tin chi tiết</h3>
              <div className="info-grid">
                <div className="info-item">
                  <FaHome />
                  <span>Loại: {post.category?.name}</span>
                </div>
                <div className="info-item">
                  <FaRuler />
                  <span>Diện tích: {post.area_Size} m²</span>
                </div>
                {/* <div className="info-item">
                  <FaMapMarkerAlt />
                  <span>Địa chỉ: {post.address}</span>
                </div> */}
                <div className="info-item">
                  <FaUser />
                  <span>Người đăng: {post.user?.name}</span>
                </div>
              </div>
            </div>

            <div className="description">
              <h3>Mô tả</h3>
              <p>{post.description}</p>
            </div>

            {/* Contact Information */}
            <div className="contact-section">
              <h2 className="section-title">Thông tin liên hệ</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <FaUser className="contact-icon" />
                  <span>{post.user?.name}</span>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <span>{post.user?.phone}</span>
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <span>{post.user?.email}</span>
                </div>
              </div>
            </div>

            {/* Add Chat Button */}
            {user && user.id !== post.userId && (
              <div className="chat-button-container mt-4">
                <Link 
                  to={`/messages?postId=${post.id}&userId=${post.user.id}&postTitle=${encodeURIComponent(post.title)}&postUsername=${encodeURIComponent(post.user.name)}`}
                  className="chat-button"
                >
                  <FaCommentDots className="mr-2" />
                  Nhắn tin
                </Link>
              </div>
            )}

            {user && (user.id === post.userId || user.role === "Admin") && (
              <div className="action-buttons">
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit className="mr-2" />
                  Chỉnh sửa
                </button>
                <button
                  className="delete-button"
                  onClick={handleDelete}
                >
                  <FaTrash className="mr-2" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chỉnh sửa bài viết</h2>
              <button onClick={() => setIsEditing(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Tiêu đề</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="form-input"
                  rows="4"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <select
                    value={editForm.priceUnit}
                    onChange={(e) => setEditForm({ ...editForm, priceUnit: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value={PriceUnit.Triệu}>Triệu</option>
                    <option value={PriceUnit.Tỷ}>Tỷ</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={editForm.area_Size}
                    onChange={(e) => setEditForm({ ...editForm, area_Size: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên đường</label>
                  <input
                    type="text"
                    value={editForm.street_Name}
                    onChange={(e) => setEditForm({ ...editForm, street_Name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Loại bất động sản</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Khu vực</label>
                  <select
                    value={editForm.areaId}
                    onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{`${area.ward}, ${area.district}, ${area.city}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Loại giao dịch</label>
                <select
                  value={editForm.transactionType}
                  onChange={(e) => setEditForm({ ...editForm, transactionType: parseInt(e.target.value) })}
                  className="form-input"
                  required
                >
                  <option value={TransactionType.Sale}>Mua bán</option>
                  <option value={TransactionType.Rent}>Cho thuê</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">
                  Hủy
                </button>
                <button type="submit" className="submit-button">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
