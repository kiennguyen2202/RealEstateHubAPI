import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Button, Form, Input, Select, InputNumber, Upload, message, notification, Card, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import MessageProvider from '../../components/MessageProvider.jsx';
import { userService } from '../../api/userService.js';
import MapComponent from '../../components/MapComponent.jsx';

const { Step } = Steps;
const { Option } = Select;

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

// Hook custom để quản lý session storage với userId
const useFormSession = (key, initialValue, userId) => {
  const storageKey = userId ? `createPostWizard_${userId}_${key}` : key;
  
  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : initialValue;
  });

  const setValueWithStorage = (newValue) => {
    setValue(newValue);
    sessionStorage.setItem(storageKey, JSON.stringify(newValue));
  };

  const clearStorage = () => {
    sessionStorage.removeItem(storageKey);
    setValue(initialValue);
  };

  return [value, setValueWithStorage, clearStorage];
};

const getMapZoom = (cityId, districtId, wardId) => {
  const minZoom = 5;
  if (wardId && String(wardId) !== '') return minZoom + 12;
  if (districtId && String(districtId) !== '') return minZoom + 10;
  if (cityId && String(cityId) !== '') return minZoom + 8;
  return minZoom;
};

const CreatePostWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showMessage, contextHolder } = MessageProvider();
  const getLimitInfo = (roleName) => {
    switch (roleName) {
      case 'Pro_1': return { limit: 100, days: 30 };
      case 'Pro_3': return { limit: 300, days: 90 };
      case 'Pro_12': return { limit: 1200, days: 365 };
      default: return { limit: 5, days: 7 };
    }
  };
  
  // Luôn bắt đầu từ bước 1 khi vào trang
  const [current, setCurrent] = useState(0);
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  
  // Sử dụng session storage cho các state quan trọng với userId
  const [imagePreviews, setImagePreviews] = useFormSession('ImagePreviews', [], user?.id);
  const [imagesBase64, setImagesBase64] = useState([]);
  const [files, setFiles] = useState([]); // Controlled fileList for Upload
  const [fullAddress, setFullAddress] = useFormSession('FullAddress', '', user?.id);
  const [zoomLevel, setZoomLevel] = useFormSession('ZoomLevel', 5, user?.id);
  
  // Panorama images state (multiple images for tour)
  const [panoFiles, setPanoFiles] = useState([]); // Array of files
  const [panoPreviews, setPanoPreviews] = useState([]); // Array of preview URLs
  
  // Sử dụng session storage cho địa chỉ với userId
  const [city, setCity] = useFormSession('City', '', user?.id);
  const [district, setDistrict] = useFormSession('District', '', user?.id);
  const [ward, setWard] = useFormSession('Ward', '', user?.id);
  const [streetName, setStreetName] = useFormSession('StreetName', '', user?.id);
  
  const [categories, setCategories] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);

  // Cấu hình thông báo để hiển thị đầy đủ nội dung và nằm gọn trong màn hình
  useEffect(() => {
    try {
      notification.config({ placement: 'top', top: 16, maxCount: 1, duration: 6 });
    } catch (_) {}
  }, []);


  // Fetch data khi component mount
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
        
        setCategories(categoriesRes.data);
        setUniqueCities(citiesRes.data);
        setAllAreas([...districtsRes.data, ...wardsRes.data]);
        
        // Load địa chỉ từ session storage và fetch districts/wards nếu cần
        if (city) {
          handleCityChange(city);
        }
        if (district) {
          handleDistrictChange(district);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      }
    };

    fetchData();
  }, [user, navigate, form]);

  // Kiểm tra tin nháp sau khi đã có dữ liệu areas
  useEffect(() => {
    if (user?.id && uniqueCities.length > 0) {
      // Chỉ kiểm tra khi có cities, không cần đợi districts/wards
      checkForDraft().then(hasDraft => {
        if (hasDraft) {
          setShowDraftPopup(true);
        }
      });
    }
  }, [user, uniqueCities]);

  // Kiểm tra có tin nháp không
  const checkForDraft = async () => {
    if (!user?.id) return false;
    
    try {
      const response = await axiosPrivate.get('/api/posts/draft');
      if (response.data.hasDraft) {
        // Lưu dữ liệu draft vào session storage để hiển thị popup
        const { formData, currentStep } = response.data;
        const draftData = { ...formData, currentStep };
        sessionStorage.setItem(`draftData_${user.id}`, JSON.stringify(draftData));
        console.log('Draft data saved to session for popup:', draftData);
      }
      return response.data.hasDraft;
    } catch (error) {
      console.error('Lỗi khi kiểm tra tin nháp:', error);
      return false;
    }
  };

  // Load tin nháp
  const loadDraft = async () => {
    if (!user?.id) return;
    
    try {
      const response = await axiosPrivate.get('/api/posts/draft');
      if (response.data.hasDraft) {
        const { formData, currentStep } = response.data;
        
        console.log('Loading draft formData:', formData);
        console.log('Images data:', formData.images);
        
        // Lưu dữ liệu draft vào session storage để hiển thị
        const draftData = { ...formData, currentStep };
        sessionStorage.setItem(`draftData_${user.id}`, JSON.stringify(draftData));
        
        // Cập nhật state địa chỉ trước
        if (formData.city) {
          setCity(formData.city);
          await handleCityChange(formData.city);
        }
        if (formData.district) {
          setDistrict(formData.district);
          await handleDistrictChange(formData.district);
        }
        if (formData.ward) {
          setWard(formData.ward);
        }
        if (formData.street_Name) {
          setStreetName(formData.street_Name);
        }
        
        // Load hình ảnh nếu có
        let draftFileList = [];
        if (formData.images && formData.images.fileList) {
          console.log('Loading images from fileList:', formData.images.fileList);
          draftFileList = formData.images.fileList;
        } else if (Array.isArray(formData.images)) {
          draftFileList = formData.images;
        }

        // Nếu không có fileList, thử từ imagesBase64 (được lưu khi user chọn ảnh)
        if ((!draftFileList || draftFileList.length === 0) && Array.isArray(formData.imagesBase64)) {
          draftFileList = formData.imagesBase64.map((img, index) => ({
            uid: img.uid || `draft-image-${index}`,
            name: img.name || `image-${index + 1}`,
            status: 'done',
            thumbUrl: img.dataUrl,
            url: img.dataUrl
          }));
        }

        if (draftFileList.length > 0) {
          const normalizedFileList = draftFileList.map((file, index) => {
            const isFileObj = typeof File !== 'undefined' && file.originFileObj instanceof File;
            const thumb = file.thumbUrl || file.url || file.preview || (isFileObj ? URL.createObjectURL(file.originFileObj) : undefined) || (file.dataUrl ?? undefined);
            return {
              uid: file.uid || `draft-image-${index}`,
              name: file.name || `image-${index + 1}`,
              status: file.status || 'done',
              type: file.type || 'image/jpeg',
              originFileObj: isFileObj ? file.originFileObj : undefined,
              url: file.url || thumb,
              thumbUrl: thumb,
              preview: thumb
            };
          });

          // cập nhật previews cho popup (ưu tiên dataUrl để bền qua reload)
          const previews = normalizedFileList
            .map(f => f.thumbUrl)
            .filter(Boolean);
          setImagePreviews(previews);
          console.log('Set imagePreviews:', previews);

          // bind lại vào form theo đúng schema của Upload
          form.setFieldsValue({ images: normalizedFileList });
          setFiles(normalizedFileList);

          // giữ lại danh sách đã chuẩn hoá khi set toàn bộ form phía dưới
          formData.images = normalizedFileList;
        }
        
        // Set form values sau khi đã có dữ liệu areas
        setTimeout(() => {
          form.setFieldsValue(formData);
          setCurrent(currentStep || 0);
        }, 200);
        
        setShowDraftPopup(false);
        showMessage.success('Đã tải tin nháp thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi tải tin nháp:', error);
      showMessage.error('Không thể tải tin nháp. Vui lòng thử lại.');
    }
  };

  // Lưu tin nháp
  const saveDraft = async () => {
    if (!user?.id) return;
    
    const currentValues = { ...form.getFieldsValue(true), imagesBase64 };
    if (Object.keys(currentValues).length > 0) {
      try {
        const response = await axiosPrivate.post('/api/posts/draft/save', {
          formData: currentValues,
          currentStep: current
        });
        
        if (response.data) {
          showMessage.success('Đã lưu tin nháp thành công!');
        }
      } catch (error) {
        console.error('Lỗi khi lưu tin nháp:', error);
        showMessage.error('Không thể lưu tin nháp. Vui lòng thử lại.');
      }
    }
  };

  // Helper functions để hiển thị thông tin tin nháp
  const getDraftTitle = () => {
    if (!user?.id) return '---';
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('Getting draft title from:', parsed);
        return parsed.title || 'Chưa có tiêu đề';
      }
    } catch (e) {
      console.log('Error getting draft title:', e);
      return '---';
    }
    return '---';
  };

  const getDraftAddress = () => {
    if (!user?.id) return '---';
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        const addressParts = [];
        
        // Lấy tên đường
        if (parsed.street_Name) {
          addressParts.push(parsed.street_Name);
        }
        
        // Lấy tên phường/xã
        if (parsed.ward) {
          const wardObj = filteredWards.find(w => String(w.id) === String(parsed.ward));
          if (wardObj) addressParts.push(wardObj.name);
        }
        
        // Lấy tên quận/huyện
        if (parsed.district) {
          const districtObj = filteredDistricts.find(d => String(d.id) === String(parsed.district));
          if (districtObj) addressParts.push(districtObj.name);
        }
        
        // Lấy tên thành phố
        if (parsed.city) {
          const cityObj = uniqueCities.find(c => String(c.id) === String(parsed.city));
          if (cityObj) addressParts.push(cityObj.name);
        }
        
        return addressParts.length > 0 ? addressParts.join(', ') : 'Chưa có địa chỉ';
      }
    } catch (e) {
      return '---';
    }
    return '---';
  };

  const getDraftPrice = () => {
    if (!user?.id) return '---';
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        if (parsed.price) {
          const unit = parsed.priceUnit === 0 ? 'Tỷ' : 'Triệu';
          return `${parsed.price} ${unit}`;
        }
        return 'Chưa có giá';
      }
    } catch (e) {
      return '---';
    }
    return '---';
  };

  const getDraftImages = () => {
    if (!user?.id) return [];
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('Getting draft images from:', parsed);
        
        // Ưu tiên imagesBase64 nếu có (bền qua reload)
        if (Array.isArray(parsed.imagesBase64) && parsed.imagesBase64.length > 0) {
          return parsed.imagesBase64.map((img, index) => ({
            thumbUrl: img.dataUrl,
            uid: img.uid || `draft-image-${index}`
          }));
        }

        // Thử lấy từ fileList trước
        if (parsed.images && parsed.images.fileList && parsed.images.fileList.length > 0) {
          console.log('Found fileList:', parsed.images.fileList);
          return parsed.images.fileList.map((file, index) => ({
            thumbUrl: file.thumbUrl || file.url || file.preview,
            uid: file.uid || `draft-image-${index}`
          }));
        }
        
        // Thử lấy từ imagePreviews nếu không có fileList
        if (imagePreviews && imagePreviews.length > 0) {
          console.log('Using imagePreviews:', imagePreviews);
          return imagePreviews.map((url, index) => ({
            thumbUrl: url,
            uid: `draft-image-${index}`
          }));
        }
        
        // Thử lấy từ parsed.images trực tiếp
        if (parsed.images && Array.isArray(parsed.images)) {
          console.log('Using parsed.images array:', parsed.images);
          return parsed.images.map((img, index) => {
            const url = typeof img === 'string' ? img : (img.thumbUrl || img.url || img.preview);
            return {
              thumbUrl: url,
              uid: `draft-image-${index}`
            };
          });
        }

        // No images
      }
    } catch (e) {
      console.log('Error getting draft images:', e);
      return [];
    }
    return [];
  };

  const getDraftStep = () => {
    if (!user?.id) return '---';
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        const stepNames = ['Hình thức', 'Địa chỉ', 'Thông tin', 'Tiêu đề & Mô tả', 'Hình ảnh'];
        return stepNames[parsed.currentStep] || `Bước ${parsed.currentStep + 1}`;
      }
    } catch (e) {
      return '---';
    }
    return '---';
  };

  // Bỏ qua tin nháp
  const ignoreDraft = async () => {
    setShowDraftPopup(false);
    
    // Xóa tin nháp từ server và session storage
    if (user?.id) {
      try {
        await axiosPrivate.delete('/api/posts/draft');
        // Xóa session storage
        sessionStorage.removeItem(`draftData_${user.id}`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_ImagePreviews`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_FullAddress`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_ZoomLevel`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_City`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_District`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_Ward`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_StreetName`);
        
        // Reset form và state
        form.resetFields();
        setCurrent(0);
        setCity('');
        setDistrict('');
        setWard('');
        setStreetName('');
        setImagePreviews([]);
        setFiles([]);
        setFullAddress('');
        setZoomLevel(5);
        
        // Clear file upload component
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = '';
        }
        
        showMessage.success('Đã xóa tin nháp thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa tin nháp:', error);
        showMessage.error('Không thể xóa tin nháp. Vui lòng thử lại.');
      }
    }
  };

  
  useEffect(() => {
    let addressParts = [];
    if (ward && String(ward) !== '') {
      const wardObj = filteredWards.find(w => String(w.id) === String(ward));
      if (wardObj) addressParts.push(wardObj.name);
    } else if (streetName) {
      addressParts.push(streetName);
    }
    if (district && String(district) !== '') {
      const districtObj = filteredDistricts.find(d => String(d.id) === String(district));
      if (districtObj) addressParts.push(districtObj.name);
    }
    if (city && String(city) !== '') {
      const cityObj = uniqueCities.find(c => String(c.id) === String(city));
      if (cityObj) addressParts.push(cityObj.name);
    }
    setFullAddress(addressParts.filter(Boolean).join(', '));
    const newZoomLevel = getMapZoom(city, district, ward);
    setZoomLevel(newZoomLevel);
  }, [city, district, ward, streetName, filteredDistricts, filteredWards, uniqueCities]);

 

  // Handler khi chọn thành phố
  const handleCityChange = async (cityId) => {
    setCity(cityId);
    setDistrict('');
    setWard('');
    setStreetName('');
    setFilteredWards([]);
    setFilteredDistricts([]);
    if (cityId) {
      try {
        const response = await axiosPrivate.get(`/api/areas/cities/${cityId}/districts`);
        setFilteredDistricts(response.data);
      } catch (err) {
        setFilteredDistricts([]);
      }
    }
  };

  // Handler khi chọn quận/huyện
  const handleDistrictChange = async (districtId) => {
    setDistrict(districtId);
    setWard('');
    setFilteredWards([]);
    if (districtId) {
      try {
        const response = await axiosPrivate.get(`/api/areas/districts/${districtId}/wards`);
        setFilteredWards(response.data);
      } catch (err) {
        setFilteredWards([]);
      }
    }
  };

  const handleWardChange = (wardId) => {
    setWard(wardId);
  };
  const handleStreetChange = (e) => {
    setStreetName(e.target.value);
  };

  // Handle file upload
  const handleFileChange = (info) => {
    const { fileList } = info;
    const enrichedFileList = fileList.map(f => ({
      ...f,
      thumbUrl: f.thumbUrl || (f.originFileObj ? URL.createObjectURL(f.originFileObj) : f.url || f.preview),
      url: f.url || (f.originFileObj ? URL.createObjectURL(f.originFileObj) : undefined),
      status: f.status || 'done'
    }));
    setFiles(enrichedFileList);
    const previews = enrichedFileList
      .map(file => {
        if (file.thumbUrl) return file.thumbUrl;
        if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
        if (file.url) return file.url;
        return null;
      })
      .filter(Boolean);
    setImagePreviews(previews);
    // Đồng bộ vào form (Upload tích hợp theo kiểu fileList array)
    form.setFieldsValue({ images: enrichedFileList });

    // Lưu thêm bản sao base64 để khôi phục file khi reload
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    (async () => {
      const base64List = [];
      for (const f of enrichedFileList) {
        if (f.originFileObj) {
          try {
            const dataUrl = await toBase64(f.originFileObj);
            base64List.push({ name: f.name, type: f.originFileObj.type, dataUrl });
          } catch (_) {}
        }
      }
      if (base64List.length > 0) {
        setImagesBase64(base64List);
        // cũng lưu vào session để popup sử dụng ngay cả khi chưa save server
        if (user?.id) {
          const draft = sessionStorage.getItem(`draftData_${user.id}`);
          const merged = draft ? { ...JSON.parse(draft), imagesBase64: base64List } : { imagesBase64: base64List };
          sessionStorage.setItem(`draftData_${user.id}`, JSON.stringify(merged));
        }
      }
    })();
  };

  const handleRemoveImage = (file) => {
    const fileList = form.getFieldValue('images') || [];
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    form.setFieldsValue({ images: newFileList });
    
    const newPreviews = imagePreviews.filter((_, index) => index !== fileList.indexOf(file));
    setImagePreviews(newPreviews);
  };

  // Handle panorama images upload (multiple files)
  const handlePanoChange = (info) => {
    const { fileList } = info;
    
    // Get all file objects
    const files = fileList.map(f => f.originFileObj || f).filter(Boolean);
    setPanoFiles(files);
    
    // Create previews for all files
    if (files.length === 0) {
      setPanoFiles([]);
      setPanoPreviews([]);
      return;
    }
    
    const previews = [];
    let loadedCount = 0;
    
    files.forEach((file, index) => {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews[index] = e.target.result;
          loadedCount++;
          if (loadedCount === files.length) {
            setPanoPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.thumbUrl || file.url) {
        previews[index] = file.thumbUrl || file.url;
        loadedCount++;
      }
    });
    
    // If all previews are loaded synchronously (no File objects)
    if (loadedCount === files.length && previews.length > 0) {
      setPanoPreviews(previews);
    }
  };

  // Thêm hàm log giá trị form
  const handleLogCurrentFormValues = () => {
    const values = form.getFieldsValue(true);
    console.log('Giá trị form hiện tại:', values);
    Object.entries(values).forEach(([k, v]) => {
      console.log(`${k}:`, v, typeof v);
    });
  };

  const steps = [
    {
      title: 'Hình thức',
      content: (
        <Form.Item name="transactionType" label="Nhu cầu" rules={[{ required: true, message: 'Vui lòng chọn nhu cầu!' }]}> 
          <Select placeholder="Chọn hình thức giao dịch">
            <Option value="Sale">Bán</Option>
            <Option value="Rent">Cho thuê</Option>
          </Select>
        </Form.Item>
      )
    },
    {
      title: 'Địa chỉ',
      content: (
        <>
          <Form.Item name="city" label="Thành phố" rules={[{ required: true, message: 'Vui lòng chọn thành phố!' }]}> 
            <Select 
              placeholder="Chọn thành phố" 
              showSearch
              value={city}
              onChange={handleCityChange}
            >
              {uniqueCities.map(city => (
                <Option key={city.id} value={city.id}>{city.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="district" label="Quận/Huyện" rules={[{ required: true, message: 'Vui lòng chọn quận/huyện!' }]}> 
            <Select 
              placeholder="Chọn quận/huyện" 
              showSearch
              value={district}
              disabled={!city}
              onChange={handleDistrictChange}
            >
              {filteredDistricts.map(district => (
                <Option key={district.id} value={district.id}>{district.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ward" label="Phường/Xã" rules={[{ required: true, message: 'Vui lòng chọn phường/xã!' }]}> 
            <Select 
              placeholder="Chọn phường/xã" 
              showSearch
              value={ward}
              disabled={!district}
              onChange={handleWardChange}
            >
              {filteredWards.map(ward => (
                <Option key={ward.id} value={ward.id}>{ward.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="street_Name" label="Tên đường" rules={[{ required: true, message: 'Vui lòng nhập tên đường!' }]}> 
            <Input placeholder="Nhập tên đường" value={streetName} onChange={handleStreetChange} />
          </Form.Item>
          <div style={{ margin: '24px 0' }}>
            <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Bản đồ khu vực:</label>
            <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
              <MapComponent address={fullAddress} zoom={zoomLevel} key={zoomLevel + '-' + fullAddress} />
            </div>
          </div>
        </>
      )
    },
   
    {
      title: 'Thông tin',
      content: (
        <>
          <Form.Item name="phapLy" label="Giấy tờ pháp lý">
            <Select placeholder="Chọn giấy tờ pháp lý">
              <Option value="Sổ đỏ">Sổ đỏ</Option>
              <Option value="Sổ hồng">Sổ hồng</Option>
              <Option value="Hợp đồng mua bán">Hợp đồng mua bán</Option>
              <Option value="Giấy tờ khác">Giấy tờ khác</Option>
            </Select>
          </Form.Item>
          {/* <Form.Item name="noiThat" label="Nội thất">
            <Select placeholder="Chọn nội thất">
              <Option value="Đầy đủ">Đầy đủ</Option>
              <Option value="Cơ bản">Cơ bản</Option>
              <Option value="Không có">Không có</Option>
            </Select>
          </Form.Item> */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="soPhongNgu" label="Số phòng ngủ">
                <CustomNumberInput />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="soPhongTam" label="Số phòng tắm/WC">
                <CustomNumberInput />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="soTang" label="Số tầng">
                <CustomNumberInput />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
          <Form.Item name="huongNha" label="Hướng nhà">
            <Select placeholder="Chọn hướng nhà">
              <Option value="Đông">Đông</Option>
              <Option value="Tây">Tây</Option>
              <Option value="Nam">Nam</Option>
              <Option value="Bắc">Bắc</Option>
              <Option value="Đông Bắc">Đông Bắc</Option>
              <Option value="Tây Bắc">Tây Bắc</Option>
              <Option value="Đông Nam">Đông Nam</Option>
              <Option value="Tây Nam">Tây Nam</Option>
            </Select>
          </Form.Item>
            </Col>
            <Col span={12}>
          <Form.Item name="huongBanCong" label="Hướng ban công">
            <Select placeholder="Chọn hướng ban công">
              <Option value="Đông">Đông</Option>
              <Option value="Tây">Tây</Option>
              <Option value="Nam">Nam</Option>
              <Option value="Bắc">Bắc</Option>
              <Option value="Đông Bắc">Đông Bắc</Option>
              <Option value="Tây Bắc">Tây Bắc</Option>
              <Option value="Đông Nam">Đông Nam</Option>
              <Option value="Tây Nam">Tây Nam</Option>
            </Select>
          </Form.Item>
            </Col>
            </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="matTien" label="Mặt tiền (m)">
                <Input type="number" min={0} placeholder="Nhập số mét" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duongVao" label="Đường vào (m)">
                <Input type="number" min={0} placeholder="Nhập số mét" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Loại BĐS" rules={[{ required: true, message: 'Vui lòng chọn loại BĐS!' }]}> 
            <Select placeholder="Chọn loại BĐS">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>
            </Col>
            <Col span={12}>
           <Form.Item name="price" label="Mức giá" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}> 
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập mức giá" />
          </Form.Item>
          </Col>
            </Row>
          <Row gutter={16}>
            <Col span={12}>
             
          <Form.Item name="priceUnit" label="Đơn vị" rules={[{ required: true, message: 'Vui lòng chọn đơn vị!' }]}> 
            <Select placeholder="Chọn đơn vị">
              <Option value={PriceUnit.Triệu}>Triệu</Option>
              <Option value={PriceUnit.Tỷ}>Tỷ</Option>
            </Select>
          </Form.Item>
            </Col>
            <Col span={12}>
          <Form.Item name="area_Size" label="Diện tích (m²)" rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}> 
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập diện tích" />
          </Form.Item>
            </Col>
          </Row>
          
          
        </>
      )
    },
    {
      title: 'Tiêu đề & Mô tả',
      content: (
        <>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}> 
            <Input placeholder="Nhập tiêu đề tin đăng" maxLength={99} showCount />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}> 
            <Input.TextArea rows={5} placeholder="Nhập mô tả chi tiết về bất động sản" maxLength={3000} showCount />
          </Form.Item>
        </>
      )
    },
    {
      title: 'Hình ảnh',
      content: (
        <>
          <Form.Item 
            name="images" 
            label="Hình ảnh" 
            valuePropName="fileList"
            getValueFromEvent={e => (Array.isArray(e) ? e : e?.fileList)}
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ảnh!' }]}
          > 
            <Upload 
              listType="picture" 
              beforeUpload={() => false} 
              multiple
              isImageUrl={() => true}
              fileList={files}
              onChange={info => { handleFileChange(info); handleLogCurrentFormValues(); }}
              onRemove={handleRemoveImage}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item 
            name="panoImages" 
            label="Tour 3D - Panorama 360° (Tùy chọn)" 
            extra="Upload nhiều ảnh panorama 360° để tạo tour 3D tương tác (kéo thả để sắp xếp thứ tự)"
          > 
            <Upload 
              listType="picture" 
              beforeUpload={() => false} 
              multiple
              fileList={panoFiles.map((file, idx) => ({
                uid: `pano-${idx}`,
                name: file.name || `panorama-${idx + 1}.jpg`,
                status: 'done',
                thumbUrl: panoPreviews[idx],
                originFileObj: file
              }))}
              onChange={handlePanoChange}
              onRemove={(file) => {
                const index = panoFiles.findIndex(f => f === file.originFileObj);
                if (index !== -1) {
                  const newFiles = [...panoFiles];
                  const newPreviews = [...panoPreviews];
                  newFiles.splice(index, 1);
                  newPreviews.splice(index, 1);
                  setPanoFiles(newFiles);
                  setPanoPreviews(newPreviews);
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh Panorama 360°</Button>
            </Upload>
            {panoPreviews.length > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: '#e8f4ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                <p style={{ marginBottom: 8, fontWeight: 500, color: '#0050b3' }}>
                  📸 Preview Tour 3D ({panoPreviews.length} ảnh):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {panoPreviews.map((preview, idx) => (
                    <div key={idx} style={{ width: 80, height: 80, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                      <img src={preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ textAlign: 'center', fontSize: '11px', padding: 2, background: '#fff' }}>
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 8, fontSize: '12px', color: '#0050b3' }}>
                  💡 Các ảnh sẽ tự động tạo tour 3D với nút chuyển đổi giữa các ảnh
                </p>
              </div>
            )}
          </Form.Item>
        </>
      )
    }
  ];

  const next = () => {
    // Lấy tên các trường của bước hiện tại
    const currentStepFields = React.Children.toArray(steps[current].content.props.children)
      .map(child => child.props && child.props.name)
      .filter(Boolean);

    form
      .validateFields(currentStepFields)
      .then(() => {
        setCurrent(current + 1);
      })
      .catch(() => {});
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Log toàn bộ values và kiểu dữ liệu
      console.log('values on submit:', values);
      Object.entries(values).forEach(([k, v]) => {
        console.log(`${k}:`, v, typeof v);
      });

      // Lấy AreaId từ ward (id phường)
      const areaId = values.ward ? parseInt(values.ward) : undefined;
      // Lấy các trường số, ép kiểu an toàn
      const price = Number(values.price);
      const areaSize = Number(values.area_Size);
      const categoryId = Number(values.categoryId);
      const priceUnit = Number(values.priceUnit);

      // Validate required fields
      if (!values.title || !values.description || !price || !areaSize || !values.street_Name || !categoryId || !areaId || !user?.id || !values.transactionType) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }
      if (isNaN(price) || price <= 0) {
        throw new Error('Mức giá không hợp lệ');
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

      const postData = new FormData();
      postData.append('Title', values.title);
      postData.append('Description', values.description);
      postData.append('Price', price);
      postData.append('PriceUnit', priceUnit);
      postData.append('Status', 'dang ban');
      postData.append('Street_Name', values.street_Name);
      postData.append('Area_Size', areaSize);
      postData.append('CategoryId', categoryId);
      postData.append('AreaId', areaId);
      postData.append('UserId', user.id);
      postData.append('TransactionType', values.transactionType);
      postData.append('SoPhongNgu', values.soPhongNgu || '');
      postData.append('SoPhongTam', values.soPhongTam || '');
      postData.append('SoTang', values.soTang || '');
      postData.append('HuongNha', values.huongNha || '');
      postData.append('HuongBanCong', values.huongBanCong || '');
      postData.append('MatTien', values.matTien || '');
      postData.append('DuongVao', values.duongVao || '');
      postData.append('PhapLy', values.phapLy || '');

      // Chuẩn hóa danh sách ảnh từ form (hỗ trợ cả mảng trực tiếp và {fileList})
      const imageItems = Array.isArray(values.images)
        ? values.images
        : (values.images && Array.isArray(values.images.fileList))
        ? values.images.fileList
        : [];

      // Chuyển các item thành File để upload (ưu tiên originFileObj, fallback tải từ url/thumbUrl nếu có)
      const urlToFile = async (url, nameFallback) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const name = nameFallback || `image-${Date.now()}.jpg`;
          return new File([blob], name, { type: blob.type || 'image/jpeg' });
        } catch (_) {
          return null;
        }
      };

      const filesToUpload = [];
      for (const item of imageItems) {
        if (item && item.originFileObj) {
          filesToUpload.push(item.originFileObj);
        } else if (item && (item.thumbUrl || item.url)) {
          const f = await urlToFile(item.thumbUrl || item.url, item.name);
          if (f) filesToUpload.push(f);
        } else if (item && item.dataUrl) {
          // Khôi phục từ base64 khi có
          const res = await fetch(item.dataUrl);
          const blob = await res.blob();
          filesToUpload.push(new File([blob], item.name || `image-${Date.now()}.jpg`, { type: item.type || blob.type }));
        }
      }

      if (filesToUpload.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 ảnh');
      }

      console.log('Total files to upload:', filesToUpload.length, filesToUpload.map(f => f.name));
      filesToUpload.forEach(f => postData.append('Images', f));

      // Add panorama images if available (upload as regular images to create 3D tour)
      if (panoFiles && panoFiles.length > 0) {
        panoFiles.forEach((panoFile, idx) => {
          postData.append('Images', panoFile);
          console.log(`Adding panorama image ${idx + 1}:`, panoFile.name);
        });
      }

      // Log FormData contents
      for (let pair of postData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      console.log('Sending request to create post...');
      const response = await axiosPrivate.post('/api/posts?role=0', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 20000
      });

      console.log('Response received:', response.data);

      if (response.data) {
        showMessage.success('Bài đăng đã được tạo thành công!');
        setTimeout(() => {
          navigate(`/chi-tiet/${response.data.id}`);
        }, 1500);
      } else {
        throw new Error('Không nhận được dữ liệu từ server');
      }
    } catch (err) {
      let backendMsg = 'Đã xảy ra lỗi khi tạo bài đăng.';
      try {
        const res = err?.response;
        const data = res?.data;
        if (typeof data === 'string') {
          backendMsg = data;
        } else if (data instanceof Blob) {
          const text = await data.text();
          backendMsg = text || backendMsg;
        } else if (data && typeof data === 'object') {
          // Ưu tiên các trường thông báo phổ biến từ BE .NET
          backendMsg = data.message || data.title || data.detail || data.error || backendMsg;
        } else if (err?.message) {
          backendMsg = err.message;
        }

        // Không ghi đè thông điệp; luôn hiển thị nội dung trả về từ BE
      } catch (_) {}
      try {
        notification.error({
          message: 'Không thể đăng bài',
          description: (
            <div style={{
              maxWidth: '96vw',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              lineHeight: 1.5,
              fontSize: 14,
            }}>
              {backendMsg}
            </div>
          ),
          key: 'create-post-submit',
          placement: 'top',
          duration: 8,
          style: { width: 'auto' }
        });
      } catch (_) {}
      showMessage.error(backendMsg);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Bỏ spinner toàn trang khi loading

  return (
    <Card style={{ maxWidth: 800, margin: '32px auto', boxShadow: '0 2px 16px #eee' }}>
      {contextHolder}
      
      {/* Popup tin nháp */}
      {showDraftPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>📝 Phát hiện tin nháp!</h3>
            
                         {/* Hiển thị thông tin tin nháp */}
             <div style={{ 
               background: '#f5f5f5', 
               padding: '16px', 
               borderRadius: '8px', 
               marginBottom: '20px',
               textAlign: 'left'
             }}>
               <h4 style={{ marginBottom: '12px', color: '#333' }}>Thông tin tin nháp:</h4>
               <div style={{ fontSize: '14px', color: '#666' }}>
                 <p><strong>Tiêu đề:</strong> {getDraftTitle()}</p>
                 <p><strong>Địa chỉ:</strong> {getDraftAddress()}</p>
                 <p><strong>Giá:</strong> {getDraftPrice()}</p>
                 <p><strong>Bước hiện tại:</strong> {getDraftStep()}</p>
               </div>
               
               {/* Hiển thị hình ảnh */}
               <div style={{ marginTop: '12px' }}>
                 <p><strong>Hình ảnh:</strong></p>
                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                   {getDraftImages().map((image, index) => (
                     <div key={index} style={{ 
                       width: '60px', 
                       height: '60px', 
                       border: '1px solid #ddd',
                       borderRadius: '4px',
                       overflow: 'hidden',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       background: '#f9f9f9'
                     }}>
                       {image.thumbUrl ? (
                         <img 
                           src={image.thumbUrl} 
                           alt={`Ảnh ${index + 1}`}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                         />
                       ) : (
                         <span style={{ fontSize: '12px', color: '#999' }}>Ảnh {index + 1}</span>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
            
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Bạn có muốn tiếp tục với tin nháp này không?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button type="primary" onClick={loadDraft}>
                ✅ Tiếp tục tin nháp
              </Button>
              <Button onClick={ignoreDraft}>
                ❌ Bỏ qua, tạo mới
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Tạo tin đăng</h1>
      <Steps current={current} style={{ marginBottom: 32 }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
                 onValuesChange={async (changedValues, allValues) => {
           // Auto-save draft khi form thay đổi
           if (user?.id && Object.keys(allValues).length > 0) {
             try {
               await axiosPrivate.post('/api/posts/draft/save', {
                 formData: allValues,
                 currentStep: current
               });
             } catch (error) {
               console.error('Lỗi khi auto-save draft:', error);
             }
           }
         }}
        style={{ marginTop: 24 }}
      >
        {steps.map((step, idx) => (
          <div key={step.title} style={{ display: idx === current ? 'block' : 'none' }}>
            {step.content}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {current > 0 && (
            <Button onClick={prev} style={{ minWidth: 100 }}>
              Quay lại
            </Button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Nút lưu tin nháp */}
            <Button 
              type="default" 
              onClick={() => saveDraft()}
              style={{ minWidth: 100 }}
            >
              💾 Lưu tin nháp
            </Button>
            
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next} style={{ minWidth: 100 }}>
              Tiếp tục
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" htmlType="submit" style={{ minWidth: 120 }}>
              Đăng tin
            </Button>
          )}
          </div>
        </div>
      </Form>
    </Card>
  );
};

const CustomNumberInput = ({ value = 0, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Button
      shape="circle"
      size="large"
      onClick={() => onChange(Math.max(0, value - 1))}
      style={{ fontSize: 20, fontWeight: 'bold', background: '#232428', color: '#fff', border: '2px solid #444' }}
    >-</Button>
    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 18 }}>{value}</span>
    <Button
      shape="circle"
      size="large"
      onClick={() => onChange(value + 1)}
      style={{ fontSize: 20, fontWeight: 'bold', background: '#232428', color: '#fff', border: '2px solid #444' }}
    >+</Button>
  </div>
);

export default CreatePostWizard;