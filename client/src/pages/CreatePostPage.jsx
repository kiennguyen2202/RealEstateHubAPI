import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosPrivate from '../api/axiosPrivate';

import './CreatePostPage.css';


// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    PriceValue: '',
    PriceUnit: PriceUnit.Triệu, // Giá trị mặc định
    Status: 'dang ban', // Giá trị mặc định
    AreaSize: '',
    StreetName: '',
    CategoryId: '',
    AreaId: '',
    Images: null, // Sẽ là FileList hoặc null
  });

  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, areasRes] = await Promise.all([
          axiosPrivate.get('/api/categories'),
          axiosPrivate.get('/api/areas')
        ]);
        setCategories(categoriesRes.data);
        setAreas(areasRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Xử lý lỗi, có thể hiển thị thông báo cho người dùng
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, Images: e.target.files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const postData = new FormData();
    for (const key in formData) {
        if (key !== 'Images') {
            postData.append(key, formData[key]);
        }
    }
    // Thêm các file ảnh vào FormData
    if (formData.Images) {
        for (let i = 0; i < formData.Images.length; i++) {
            postData.append('Images', formData.Images[i]);
        }
    }

    try {
      const response = await axiosPrivate.post('/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Bài đăng đã được tạo thành công!');
      // Có thể chuyển hướng người dùng đến trang chi tiết bài đăng mới
      navigate(`/chi-tiet/${response.data.id}`);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tạo bài đăng.');
      console.error('Error creating post:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <h1>Đăng tin bất động sản mới</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="Title">Tiêu đề:</label>
          <input type="text" id="Title" name="Title" value={formData.Title} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="Description">Mô tả:</label>
          <textarea id="Description" name="Description" value={formData.Description} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="PriceValue">Giá trị:</label>
          <input type="number" id="PriceValue" name="PriceValue" value={formData.PriceValue} onChange={handleInputChange} required min="0" />
        </div>
        <div className="form-group">
          <label htmlFor="PriceUnit">Đơn vị:</label>
          <select id="PriceUnit" name="PriceUnit" value={formData.PriceUnit} onChange={handleInputChange} required>
            <option value={PriceUnit.Triệu}>Triệu</option>
            <option value={PriceUnit.Tỷ}>Tỷ</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="AreaSize">Diện tích (m²):</label>
          <input type="number" id="AreaSize" name="AreaSize" value={formData.AreaSize} onChange={handleInputChange} required min="0" step="0.1" />
        </div>
        <div className="form-group">
          <label htmlFor="StreetName">Tên đường:</label>
          <input type="text" id="StreetName" name="StreetName" value={formData.StreetName} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="CategoryId">Loại bất động sản:</label>
          <select id="CategoryId" name="CategoryId" value={formData.CategoryId} onChange={handleInputChange} required>
            <option value="">-- Chọn loại --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="AreaId">Khu vực:</label>
          <select id="AreaId" name="AreaId" value={formData.AreaId} onChange={handleInputChange} required>
            <option value="">-- Chọn khu vực --</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{`${area.ward}, ${area.district}, ${area.city}`}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="Images">Hình ảnh:</label>
          <input type="file" id="Images" name="Images" onChange={handleFileChange} multiple accept="image/*" />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng bài'}
        </button>
      </form>
    </div>
  );
};

export default CreatePostPage; 