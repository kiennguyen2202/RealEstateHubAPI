import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosPrivate from '../api/axiosPrivate';
import { useAuth } from '../auth/AuthContext';
import MessageProvider from '../components/MessageProvider';
import MapComponent from '../components/MapComponent.jsx';
import './CreatePostPage.css';

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showMessage, contextHolder } = MessageProvider();
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    Price: '',
    PriceUnit: PriceUnit.Triệu,
    Status: 'dang ban',
    Street_Name: '',
    Area_Size: '',
    CategoryId: '',
    city: '',
    district: '',
    ward: '',
    AreaId: '', // This will now store the final selected area ID (ward level)
    Images: null,
    TransactionType: 'Sale', // Set default value to Sale
  });
  const [fullAddress, setFullAddress] = useState('');
  const [zoomLevel, setZoomLevel] = useState(5); // Default zoom level
  const [mapZoom,setMapZoom] = useState('');
  const [categories, setCategories] = useState([]);
  const [allAreas, setAllAreas] = useState([]); // Stores all areas from API
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

  // New states for selected area names
  const [selectedStreetName, setSelectedStreetName] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');

  const getMapZoom = () => {    
    let zoomLevel = (() => {
      const minZoom = 5; 
      if (formData.ward) return minZoom + 12; 
      if (formData.district) return minZoom + 10; 
      if (formData.city) return minZoom + 8;

      return minZoom;
    })();
    return zoomLevel;
};

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Fetching categories and areas...');
        const [categoriesRes, citiesRes, districtsRes, wardsRes] = await Promise.all([
          axiosPrivate.get('/api/categories'),
          axiosPrivate.get('/api/areas/cities'),
          axiosPrivate.get('/api/areas/districts'),
          axiosPrivate.get('/api/areas/wards')
        ]);
        console.log('Categories response:', categoriesRes.data);
        console.log('Cities response:', citiesRes.data);
        console.log('Districts response:', districtsRes.data);
        console.log('Wards response:', wardsRes.data);
        
        setCategories(categoriesRes.data);
        setUniqueCities(citiesRes.data); // Set cities directly from the response
        setAllAreas([...districtsRes.data, ...wardsRes.data]); // Store districts and wards

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      }
    };

    fetchData();
  }, [user, navigate]);

  // Effect for filtering districts based on selected city
  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.city) {
        try {
          console.log('Fetching districts for city:', formData.city);
          const response = await axiosPrivate.get(`/api/areas/cities/${formData.city}/districts`);
          console.log('Districts response:', response.data);
          setFilteredDistricts(response.data);
          setFilteredWards([]); // Reset wards when city changes
          setFormData(prev => ({ ...prev, district: '', ward: '', AreaId: '' }));
        } catch (err) {
          console.error('Error fetching districts:', err);
          setError('Không thể tải danh sách quận/huyện. Vui lòng thử lại sau.');
        }
      } else {
        setFilteredDistricts([]);
        setFilteredWards([]);
        setFormData(prev => ({ ...prev, district: '', ward: '', AreaId: '' }));
      }
    };

    fetchDistricts();
  }, [formData.city]);

  // Effect for filtering wards based on selected district
  useEffect(() => {
    const fetchWards = async () => {
      if (formData.district) {
        try {
          console.log('Fetching wards for district:', formData.district);
          const response = await axiosPrivate.get(`/api/areas/districts/${formData.district}/wards`);
          console.log('Wards response:', response.data);
          setFilteredWards(response.data);
          setFormData(prev => ({ ...prev, ward: '', AreaId: '' }));
        } catch (err) {
          console.error('Error fetching wards:', err);
          setError('Không thể tải danh sách phường/xã. Vui lòng thử lại sau.');
        }
      } else {
        setFilteredWards([]);
        setFormData(prev => ({ ...prev, ward: '', AreaId: '' }));
      }
    };

    fetchWards();
  }, [formData.district]);

  // Effect for updating fullAddress for the map
  useEffect(() => {
    let addressParts = [];
    // Only include Street_Name if no ward is selected for geocoding purposes.
    if (formData.ward) {
      const selectedWardObj = filteredWards.find(w => w.id === parseInt(formData.ward));
      if (selectedWardObj) {
        addressParts.push(selectedWardObj.name);
      }
    } else if (formData.Street_Name) {
      addressParts.push(formData.Street_Name);
    }
    
    if (formData.district) {
      const selectedDistrictObj = filteredDistricts.find(d => d.id === parseInt(formData.district));
      if (selectedDistrictObj) {
        addressParts.push(selectedDistrictObj.name);
      }
    }
    if (formData.city) {
      const selectedCityObj = uniqueCities.find(c => c.id === parseInt(formData.city));
      if (selectedCityObj) {
        addressParts.push(selectedCityObj.name);
      }
    }

    const fullAddress = addressParts.filter(part => part !== null && part !== undefined).join(', ');
    setFullAddress(fullAddress);
    
    // Cập nhật các state tên địa chỉ để truyền xuống MapComponent
    setSelectedStreetName(formData.Street_Name);
    setSelectedWardName(formData.ward ? filteredWards.find(w => w.id === parseInt(formData.ward)).name : '');
    setSelectedDistrictName(formData.district ? filteredDistricts.find(d => d.id === parseInt(formData.district)).name : '');
    setSelectedCityName(formData.city ? uniqueCities.find(c => c.id === parseInt(formData.city)).name : '');

    // Cập nhật zoom level dựa trên địa chỉ
    const newZoomLevel = getMapZoom();
    setZoomLevel(newZoomLevel);
    
    // Log để debug
    console.log('Full address:', fullAddress);
    console.log('Zoom level:', newZoomLevel);

  }, [formData.Street_Name, formData.city, formData.district, formData.ward, uniqueCities, filteredDistricts, filteredWards]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Handling input change for ${name} with value:`, value);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Special handling for AreaId based on ward selection
    if (name === 'ward') {
      const selectedWard = filteredWards.find(w => w.id === parseInt(value));
      console.log('Selected ward:', selectedWard);
      
      if (selectedWard) {
        console.log('Setting AreaId to ward ID:', selectedWard.id);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            AreaId: selectedWard.id // This will be used to create a new Area on the server
          };
          console.log('Updated form data:', newFormData);
          return newFormData;
        });
      }
    } else if (name === 'city') {
      console.log('City changed, resetting district, ward and AreaId');
      setFormData(prev => ({
        ...prev,
        city: value,
        district: '',
        ward: '',
        AreaId: ''
      }));
    } else if (name === 'district') {
      console.log('District changed, resetting ward and AreaId');
      setFormData(prev => ({
        ...prev,
        district: value,
        ward: '',
        AreaId: ''
      }));
    }
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
    


    try {
      // Log form data before validation
      console.log('Form data before validation:', formData);

      // Validate required fields
      if (!formData.Title || !formData.Description || !formData.Price || 
          !formData.Area_Size || !formData.Street_Name || !formData.CategoryId || 
          !formData.AreaId || !formData.Images || !formData.TransactionType) {
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
      console.log('Form data before sending:', {
        Title: formData.Title,
        Description: formData.Description,
        Price: price,
        PriceUnit: priceUnit,
        Status: formData.Status,
        Street_Name: formData.Street_Name,
        Area_Size: areaSize,
        CategoryId: categoryId,
        AreaId: areaId,
        UserId: user?.id,
        Images: formData.Images,
        TransactionType: formData.TransactionType,
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
      postData.append('Price', formData.Price);
      postData.append('PriceUnit', formData.PriceUnit);
      postData.append('Status', formData.Status);
      postData.append('Street_Name', formData.Street_Name);
      postData.append('Area_Size', formData.Area_Size);
      postData.append('CategoryId', formData.CategoryId);
      postData.append('AreaId', formData.AreaId);
      postData.append('UserId', user.id);
      postData.append('TransactionType', formData.TransactionType);

      // Add images
      if (formData.Images) {
        Array.from(formData.Images).forEach((image) => {
          postData.append('Images', image);
        });
      }

      // Log the FormData contents
      console.log('FormData contents:');
      for (let pair of postData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      console.log('Sending request to create post...');
      const response = await axiosPrivate.post('/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response received:', response.data);

      if (response.data) {
        console.log('Post created successfully, navigating to:', `/chi-tiet/${response.data.id}`);
        showMessage.success('Bài đăng đã được tạo thành công!');
        
        setTimeout(() => {
          navigate(`/chi-tiet/${response.data.id}`);
        }, 1500);
      } else {
        throw new Error('Không nhận được dữ liệu từ server');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        showMessage.error(err.response.data || 'Đã xảy ra lỗi khi tạo bài đăng.');
      } else if (err.request) {
        console.error('Error request:', err.request);
        showMessage.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      } else {
        console.error('Error message:', err.message);
        showMessage.error(err.message || 'Đã xảy ra lỗi khi tạo bài đăng.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      {contextHolder}
      <h1>Đăng tin bất động sản mới</h1>
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
        <div className="form-group">
          <label htmlFor="TransactionType">Loại giao dịch:</label>
          <select 
            id="TransactionType" 
            name="TransactionType" 
            value={formData.TransactionType} 
            onChange={handleInputChange} 
            required
            className="form-select"
          >
            <option value="">-- Chọn loại giao dịch --</option>
            <option value="Sale">Mua Bán</option>
            <option value="Rent">Cho thuê</option>
          </select>
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
          
        </div>

        <div className="form-row">
          
          <div className="form-group">
            <label htmlFor="city">Thành phố:</label>
            <select 
              id="city" 
              name="city" 
              value={formData.city} 
              onChange={handleInputChange} 
              required
              className="form-select"
            >
              <option value="">-- Chọn thành phố --</option>
              {uniqueCities && uniqueCities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
            <div className="form-group">
            <label htmlFor="district">Quận/Huyện:</label>
            <select 
              id="district" 
              name="district" 
              value={formData.district} 
              onChange={handleInputChange} 
              required
              className="form-select"
              disabled={!formData.city}
            >
              <option value="">-- Chọn Quận/Huyện --</option>
              {filteredDistricts && filteredDistricts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">

          <div className="form-group">
            <label htmlFor="ward">Phường/Xã:</label>
            <select 
              id="ward" 
              name="ward" 
              value={formData.ward} 
              onChange={handleInputChange} 
              required
              className="form-select"
              disabled={!formData.district}
            >
              <option value="">-- Chọn Phường/Xã --</option>
              {filteredWards && filteredWards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
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

        <div className="form-group">
          <label>Bản đồ khu vực:</label>
          <div className="map-container">
            <MapComponent 
              address={fullAddress} 
              zoom={zoomLevel} 
            />
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