import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosPrivate from '../api/axiosPrivate';
import { useAuth } from '../auth/AuthContext';
import './CreatePostPage.css';

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    Price: '',
    PriceUnit: PriceUnit.Triệu,
    Status: 'dang ban',
    Street_Name: '',
    Area_Size: '',
    CategoryId: '',
    AreaId: '',
    Images: null,
  });

  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

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
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    let updatedFiles = [];
    if (formData.Images) {
      updatedFiles = Array.from(formData.Images).concat(newFiles);
    } else {
      updatedFiles = newFiles;
    }

    // Tạo preview cho từng ảnh
    const previews = updatedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    // Dùng DataTransfer để tạo FileList mới
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    setFormData(prev => ({
      ...prev,
      Images: dataTransfer.files
    }));
  };

  const handleRemoveImage = (removeIdx) => {
    // Xóa preview
    const newPreviews = imagePreviews.filter((_, idx) => idx !== removeIdx);

    // Xóa file tương ứng
    const filesArr = Array.from(formData.Images || []);
    filesArr.splice(removeIdx, 1);

    // Tạo lại FileList mới
    const dataTransfer = new DataTransfer();
    filesArr.forEach(file => dataTransfer.items.add(file));

    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      Images: dataTransfer.files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate required fields
      if (!formData.Title || !formData.Description || !formData.Price || 
          !formData.Area_Size || !formData.Street_Name || !formData.CategoryId || 
          !formData.AreaId || !formData.Images) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      const postData = new FormData();
      
      // Convert numeric values and ensure they are valid
      const price = parseFloat(formData.Price);
      const areaSize = parseFloat(formData.Area_Size);
      const categoryId = parseInt(formData.CategoryId);
      const areaId = parseInt(formData.AreaId);
      const priceUnit = parseInt(formData.PriceUnit);

      // Log values for debugging
      console.log('Parsed values:', {
        price,
        areaSize,
        categoryId,
        areaId,
        priceUnit,
        userId: user?.id
      });

      // Validate each numeric value separately
      if (isNaN(price) || price <= 0) {
        throw new Error('Giá trị không hợp lệ');
      }
      if (isNaN(areaSize) || areaSize <= 0) {
        throw new Error('Diện tích không hợp lệ');
      }
      if (isNaN(categoryId) || categoryId <= 0) {
        throw new Error('Vui lòng chọn loại bất động sản');
      }
      if (isNaN(areaId) || areaId <= 0) {
        throw new Error('Vui lòng chọn khu vực');
      }
      if (isNaN(priceUnit) || (priceUnit !== 0 && priceUnit !== 1)) {
        throw new Error('Đơn vị giá không hợp lệ');
      }
      if (!user?.id) {
        throw new Error('Vui lòng đăng nhập để đăng bài');
      }

      // Append data with correct field names matching CreatePostDto
      postData.append('Title', formData.Title);
      postData.append('Description', formData.Description);
      postData.append('Price', price.toFixed(2)); // Convert to decimal string
      postData.append('PriceUnit', priceUnit);
      postData.append('Status', formData.Status);
      postData.append('Street_Name', formData.Street_Name);
      postData.append('Area_Size', areaSize);
      postData.append('CategoryId', categoryId);
      postData.append('AreaId', areaId);
      postData.append('UserId', user.id);

      // Add images
      if (formData.Images) {
        Array.from(formData.Images).forEach((image) => {
          postData.append('Images', image);
        });
      }

      // Log the data being sent (for debugging)
      console.log('Sending data:', {
        Title: formData.Title,
        Description: formData.Description,
        Price: price,
        PriceUnit: priceUnit,
        Status: formData.Status,
        Area_Size: areaSize,
        Street_Name: formData.Street_Name,
        CategoryId: categoryId,
        AreaId: areaId,
        UserId: user.id,
        ImagesCount: formData.Images ? formData.Images.length : 0
      });

      console.log('Sending request to create post...');
      const response = await axiosPrivate.post('/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response received:', response.data);

      if (response.data) {
        console.log('Post created successfully, navigating to:', `/chi-tiet/${response.data.id}`);
        setSuccessMessage('Bài đăng đã được tạo thành công!');
        
        // Hiển thị thông báo thành công trước khi chuyển trang
        setTimeout(() => {
          navigate(`/chi-tiet/${response.data.id}`);
        }, 1500); // Đợi 1.5 giây để người dùng thấy thông báo
      } else {
        throw new Error('Không nhận được dữ liệu từ server');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(err.response.data.message || 'Đã xảy ra lỗi khi tạo bài đăng.');
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', err.message);
        setError(err.message || 'Đã xảy ra lỗi khi tạo bài đăng.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <h1>Đăng tin bất động sản mới</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message" style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="Title">Tiêu đề:</label>
          <input 
            type="text" 
            id="Title" 
            name="Title" 
            value={formData.Title} 
            onChange={handleInputChange} 
            required 
            className="form-input"
            placeholder="Nhập tiêu đề tin đăng"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Description">Mô tả:</label>
          <textarea 
            id="Description" 
            name="Description" 
            value={formData.Description} 
            onChange={handleInputChange} 
            required 
            className="form-input"
            placeholder="Nhập mô tả chi tiết về bất động sản"
            rows="6"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="Price">Giá trị:</label>
            <input 
              type="number" 
              id="Price" 
              name="Price" 
              value={formData.Price} 
              onChange={handleInputChange} 
              required 
              min="0"
              step="0.01"
              className="form-input"
              placeholder="Nhập giá trị"
            />
          </div>
          <div className="form-group">
            <label htmlFor="PriceUnit">Đơn vị:</label>
            <select 
              id="PriceUnit" 
              name="PriceUnit" 
              value={formData.PriceUnit} 
              onChange={handleInputChange} 
              required
              className="form-select"
            >
              <option value={PriceUnit.Triệu}>Triệu</option>
              <option value={PriceUnit.Tỷ}>Tỷ</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="Area_Size">Diện tích (m²):</label>
            <input 
              type="number" 
              id="Area_Size" 
              name="Area_Size" 
              value={formData.Area_Size} 
              onChange={handleInputChange} 
              required 
              min="0" 
              step="0.1"
              className="form-input"
              placeholder="Nhập diện tích"
            />
          </div>
          <div className="form-group">
            <label htmlFor="Street_Name">Tên đường:</label>
            <input 
              type="text" 
              id="Street_Name" 
              name="Street_Name" 
              value={formData.Street_Name} 
              onChange={handleInputChange} 
              required
              className="form-input"
              placeholder="Nhập tên đường"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="CategoryId">Loại bất động sản:</label>
            <select 
              id="CategoryId" 
              name="CategoryId" 
              value={formData.CategoryId} 
              onChange={handleInputChange} 
              required
              className="form-select"
            >
              <option value="">-- Chọn loại --</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="AreaId">Khu vực:</label>
            <select 
              id="AreaId" 
              name="AreaId" 
              value={formData.AreaId} 
              onChange={handleInputChange} 
              
              className="form-select"
            >
              <option value="">-- Chọn khu vực --</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{`${area.ward}, ${area.district}, ${area.city}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="Images">Hình ảnh:</label>
          <div className="custom-image-upload">
            <label htmlFor="Images" className="image-upload-label">
              <span className="plus-icon">+</span>
              <span>Thêm ảnh</span>
              <input
                type="file"
                id="Images"
                name="Images"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                style={{ display: "none" }}
              />
            </label>
            <div className="image-preview-list">
              {imagePreviews.map((src, idx) => (
                <div className="image-preview-wrapper" key={idx}>
                  <img src={src} alt={`preview-${idx}`} className="image-preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => handleRemoveImage(idx)}
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Đang xử lý...' : 'Đăng bài'}
        </button>
      </form>
    </div>
  );
};

export default CreatePostPage; 