import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Button, Form, Input, Select, InputNumber, Upload, message, Card, Row, Col, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import MessageProvider from '../../components/MessageProvider.jsx';
import MapComponent from '../../components/MapComponent.jsx';

const { Step } = Steps;
const { Option } = Select;

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
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
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
  
  const [fullAddress, setFullAddress] = useState('');
  const [zoomLevel, setZoomLevel] = useState(5);

  // State riêng cho địa chỉ giống CreatePostPage.jsx
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetName, setStreetName] = useState('');

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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      }
    };

    fetchData();
  }, [user, navigate]);

  
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
    const previews = fileList.map(file => URL.createObjectURL(file.originFileObj));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (file) => {
    const fileList = form.getFieldValue('images') || [];
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    form.setFieldsValue({ images: newFileList });
    
    const newPreviews = imagePreviews.filter((_, index) => index !== fileList.indexOf(file));
    setImagePreviews(newPreviews);
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
      title: 'Hình thức giao dịch',
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
      title: 'Thông tin chính',
      content: (
        <>
          <Form.Item name="categoryId" label="Loại BĐS" rules={[{ required: true, message: 'Vui lòng chọn loại BĐS!' }]}> 
            <Select placeholder="Chọn loại BĐS">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="area_Size" label="Diện tích (m²)" rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}> 
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập diện tích" />
          </Form.Item>
          <Form.Item name="price" label="Mức giá" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}> 
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập mức giá" />
          </Form.Item>
          <Form.Item name="priceUnit" label="Đơn vị" rules={[{ required: true, message: 'Vui lòng chọn đơn vị!' }]}> 
            <Select placeholder="Chọn đơn vị">
              <Option value={PriceUnit.Triệu}>Triệu</Option>
              <Option value={PriceUnit.Tỷ}>Tỷ</Option>
            </Select>
          </Form.Item>
        </>
      )
    },
    {
      title: 'Thông tin khác',
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
        <Form.Item name="images" label="Hình ảnh" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ảnh!' }]}> 
          <Upload 
            listType="picture" 
            beforeUpload={() => false} 
            multiple
            onChange={info => { handleFileChange(info); handleLogCurrentFormValues(); }}
            onRemove={handleRemoveImage}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>
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

      // Lấy danh sách file từ fileList
      const imageList = values.images && Array.isArray(values.images.fileList)
        ? values.images.fileList
        : [];

      // Kiểm tra có ít nhất 1 ảnh
      if (imageList.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 ảnh');
      }

      // Append từng ảnh vào FormData
      imageList.forEach((fileObj) => {
        // fileObj.originFileObj là file thực
        if (fileObj.originFileObj) {
          postData.append('Images', fileObj.originFileObj);
        }
      });

      // Log FormData contents
      for (let pair of postData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      console.log('Sending request to create post...');
      const response = await axiosPrivate.post('/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      console.error('Error creating post:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        showMessage.error(err.response.data || 'Đã xảy ra lỗi khi tạo bài đăng.');
      } else if (err.request) {
        console.error('Error request:', err.request);
        showMessage.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      } else {
        console.error('Error showMessage:', err.message);
        showMessage.error(err.showMessage || 'Đã xảy ra lỗi khi tạo bài đăng.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ maxWidth: 800, margin: '32px auto', boxShadow: '0 2px 16px #eee' }}>
      {contextHolder}
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
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next} style={{ minWidth: 100 }}>
              Tiếp tục
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" htmlType="submit" loading={loading} style={{ minWidth: 120 }}>
              {loading ? 'Đang xử lý...' : 'Đăng tin'}
            </Button>
          )}
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