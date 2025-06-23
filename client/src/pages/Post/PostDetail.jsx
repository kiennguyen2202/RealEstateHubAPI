import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  FaHome, FaRuler, FaMapMarkerAlt, FaUser,
  FaPhone, FaEnvelope, FaEdit, FaTrash, FaExclamationTriangle,
  FaCommentDots, FaCrown
} from "react-icons/fa";
import "./PostDetail.css";
import { PriceUnit, formatPrice } from '../../utils/priceUtils.js';
import ReportPost from "../ReportPost.jsx";
import MapComponent from "../../components/MapComponent.jsx";
import axiosPrivate from "../../api/axiosPrivate.js";

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
  const [showMapModal, setShowMapModal] = useState(false);
  const [fullAddressForMap, setFullAddressForMap] = useState('');
  const [mapModalZoomLevel, setMapModalZoomLevel] = useState(5);
  const [newImages, setNewImages] = useState(null);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
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
    status: "",
    city: "",
    district: "",
    ward: "",
  });
  const [categories, setCategories] = useState([]);

  const getMapZoomForDetail = (postData) => {
    const minZoom = 5;
    if (postData.street_Name) return minZoom + 13;
    if (postData.area?.ward?.name) return minZoom + 12;
    if (postData.area?.district?.name) return minZoom + 10;
    if (postData.area?.city?.name) return minZoom + 8;
    return minZoom;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await axiosClient.get('/api/categories');
        setCategories(categoriesRes.data);
        const citiesRes = await axiosPrivate.get('/api/areas/cities');
        setUniqueCities(citiesRes.data);
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
        console.log('Post Area data:', response.data.area);
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
          status: response.data.status,
          city: response.data.area?.cityId || '',
          district: response.data.area?.districtId || '',
          ward: response.data.area?.id || '',
        });
        const addressParts = [];
        if (response.data.street_Name) addressParts.push(response.data.street_Name);
        if (response.data.area?.ward?.name) addressParts.push(response.data.area.ward.name);
        if (response.data.area?.district?.name) addressParts.push(response.data.area.district.name);
        if (response.data.area?.city?.name) addressParts.push(response.data.area.city.name);
        setFullAddressForMap(addressParts.join(', '));
        const newMapModalZoom = getMapZoomForDetail(response.data);
        setMapModalZoomLevel(newMapModalZoom);
      } catch (err) {
        setError("Không thể tải thông tin bài viết");
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Add new useEffect to reset scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setIsEditing(searchParams.get("edit") === "true");
  }, [location]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (editForm.city) {
        try {
          const response = await axiosPrivate.get(`/api/areas/cities/${editForm.city}/districts`);
          setFilteredDistricts(response.data);
        } catch (err) {
          console.error('Error fetching districts for edit form:', err);
        }
      } else {
        setFilteredDistricts([]);
      }
    };

    fetchDistricts();
  }, [editForm.city]);

  useEffect(() => {
    const fetchWards = async () => {
      if (editForm.district) {
        try {
          const response = await axiosPrivate.get(`/api/areas/districts/${editForm.district}/wards`);
          setFilteredWards(response.data);
        } catch (err) {
          console.error('Error fetching wards for edit form:', err);
        }
      } else {
        setFilteredWards([]);
      }
    };

    fetchWards();
  }, [editForm.district]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form data before submit:', editForm);

      const postData = new FormData();
      postData.append('Id', parseInt(id));
      postData.append('Title', editForm.title);
      postData.append('Description', editForm.description);
      postData.append('Price', parseFloat(editForm.price));
      postData.append('PriceUnit', parseInt(editForm.priceUnit));
      postData.append('Street_Name', editForm.street_Name);
      postData.append('Area_Size', parseFloat(editForm.area_Size));
      postData.append('CategoryId', parseInt(editForm.categoryId));
      postData.append('AreaId', parseInt(editForm.ward));
      postData.append('TransactionType', parseInt(editForm.transactionType));
      postData.append('UserId', post.userId);
      postData.append('Status', 'active');

      if (newImages) {
        Array.from(newImages).forEach(image => {
          postData.append('Images', image);
        });
      }

      console.log('Data being sent to server:', postData);

      const response = await axiosClient.put(`/api/posts/${id}`, postData, {
        headers: {
          'Content-Type': 'multipart/form-data'
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

  const handleAddressClick = () => {
    setShowMapModal(true);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
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
            <div className="property-meta-item clickable-address" onClick={handleAddressClick}>
              <FaMapMarkerAlt />
              <span>
                {post.street_Name}, {post.area?.ward?.name && `${post.area.ward.name}, `}{post.area?.district?.name && `${post.area.district.name}, `}{post.area?.city?.name && post.area.city.name}
              </span>
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
          {/* Left Column - Images and Info */}
          <div className="property-left-column">
            <div className="property-images" style={{position: 'relative'}}>
              {/* Pro Badge */}
              {post?.user?.role === 'Membership' && (
                <div className="pro-badge">
                  <FaCrown className="pro-crown-icon" />
                  Pro
                </div>
              )}
              <div className="image-navigation">
                <button 
                  className="nav-button prev-button"
                  onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : post.images.length - 1))}
                  disabled={!post.images || post.images.length <= 1}
                >
                  &#10094;
                </button>
                <img
                  src={
                    post.images && post.images.length > 0
                      ? `http://localhost:5134${post.images[selectedImage].url}`
                      : "https://via.placeholder.com/800x500?text=No+Image"
                  }
                  alt={post.title}
                  className="main-image"
                />
                <button 
                  className="nav-button next-button"
                  onClick={() => setSelectedImage(prev => (prev < post.images.length - 1 ? prev + 1 : 0))}
                  disabled={!post.images || post.images.length <= 1}
                >
                  &#10095;
                </button>
              </div>
              <button className='report-button' onClick={() => navigate(`/chi-tiet/${post.id}/report`)}>
                <i className="fas fa-flag"></i> Báo cáo
              </button>
              {post.images && post.images.length > 1 && (
                <div className="thumbnail-grid">
                  {post.images.map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${selectedImage === index ? "selected" : ""}`}
                      onMouseEnter={() => setSelectedImage(index)}
                    >
                      <img
                        src={`http://localhost:5134${image.url}`}
                        alt={`${post.title} - ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="property-info-section">
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
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="property-contact">
            <div className="price-tag">
              {formatPrice(post.price, post.priceUnit)}
            </div>
            <div className={`transaction-type ${post.transactionType === 0 ? 'sale' : 'rent'}`}>
              {post.transactionType === 0 ? "Mua bán" : "Cho thuê"}
            </div>

            {/* Contact Information */}
            <div className="contact-section">
              <h2 className="section-title">Thông tin liên hệ</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <img 
                    src={post.user?.avatarUrl ? `http://localhost:5134/${post.user.avatarUrl}` : '/default-avatar.png'} 
                    alt={post.user?.name || 'User'} 
                    className="user-avatar" 
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {post.user?.name}
                    {post.user?.role === 'Membership' && (
                      <span className="pro-badge" style={{ position: 'static', marginLeft: 6, padding: '4px 10px', fontSize: '0.95em', height: 28 }}>
                        <FaCrown className="pro-crown-icon" /> Pro
                      </span>
                    )}
                  </span>
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
              <div className="chat-button-container">
                <Link 
                  to={`/messages?postId=${post.id}&userId=${post.user.id}&postTitle=${encodeURIComponent(post.title)}&postUsername=${encodeURIComponent(post.user.name)}`}
                  className="chat-button"
                >
                  <FaCommentDots className="mr-2" />
                  Nhắn tin
                </Link>
              </div>
            )}

            {user && (user.id === post.userId) && (
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

      {/* Map Modal */}
      {showMapModal && (post.area?.ward?.name || post.street_Name) && (
        <div className="map-modal-overlay">
          <div className="map-modal-content">
            <div className="map-modal-header">
              <h2 className="map-modal-title">Bản đồ</h2>
              <button className="map-modal-close-button" onClick={handleCloseMapModal}>&times;</button>
            </div>
            <div className="map-modal-body">
              <MapComponent address={fullAddressForMap} zoom={17} radius={200} mapHeight="500px" />
            </div>
          </div>
        </div>
      )}

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
                  <label className="form-label">Thành phố</label>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value, district: '', ward: '', areaId: '' })}
                    className="form-input"
                    required
                  >
                    <option value="">-- Chọn thành phố --</option>
                    {uniqueCities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quận/Huyện</label>
                  <select
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value, ward: '', areaId: '' })}
                    className="form-input"
                    required
                    disabled={!editForm.city}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {filteredDistricts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phường/Xã</label>
                  <select
                    value={editForm.ward}
                    onChange={(e) => setEditForm({ ...editForm, ward: e.target.value, areaId: e.target.value })}
                    className="form-input"
                    required
                    disabled={!editForm.district}
                  >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {filteredWards.map(ward => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
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
              <div className="form-group">
                <label className="form-label">Hình ảnh mới (nếu muốn thay đổi)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewImages(e.target.files)}
                  className="form-input"
                />
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
