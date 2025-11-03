import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Card, message, Checkbox, Divider, Spin, Row, Col, Tag, Radio } from 'antd';
import { UploadOutlined, UserOutlined, PictureOutlined, PlusOutlined, CameraOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate.js';
import { useNavigate } from 'react-router-dom';
import AreaSelectionModal from './AreaSelectionModal';
import { useAuth } from '../../auth/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

export default function RegisterAgentPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes] = await Promise.all([
          axiosPrivate.get('/api/categories'),
        ]);
        setCategories(categoriesRes.data);
        
        // Load dữ liệu từ sessionStorage nếu có
        if (user?.id) {
          loadFormDataFromSession();
        }
      } catch (error) {
        message.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Load dữ liệu từ sessionStorage
  const loadFormDataFromSession = () => {
    if (!user?.id) return;
    
    try {
      console.log('Loading form data from session storage...');
      
      // Load form data
      const formData = sessionStorage.getItem(`agentForm_${user.id}`);
      if (formData) {
        const parsedData = JSON.parse(formData);
        console.log('Loaded form data:', parsedData);
        setTimeout(() => {
          form.setFieldsValue(parsedData);
        }, 100);
      }
      
      // Load avatar preview
      // Prefer server URL saved from preview page. If present, override blob in cache
      const serverAvatar = sessionStorage.getItem(`agentServerAvatar_${user.id}`);
      let avatarData = serverAvatar || sessionStorage.getItem(`agentAvatar_${user.id}`);
      if (serverAvatar) {
        sessionStorage.setItem(`agentAvatar_${user.id}`, serverAvatar);
      }
      if (avatarData) {
        console.log('Loaded avatar preview:', avatarData);
        setAvatarPreview(avatarData);
      }
      
      // Load banner preview
      const serverBanner = sessionStorage.getItem(`agentServerBanner_${user.id}`);
      let bannerData = serverBanner || sessionStorage.getItem(`agentBanner_${user.id}`);
      if (serverBanner) {
        sessionStorage.setItem(`agentBanner_${user.id}`, serverBanner);
      }
      if (bannerData) {
        console.log('Loaded banner preview:', bannerData);
        setBannerPreview(bannerData);
      }
      
      // Load selected areas
      const areasData = sessionStorage.getItem(`agentAreas_${user.id}`);
      if (areasData) {
        try {
          const parsedAreas = JSON.parse(areasData);
          console.log('Loaded selected areas:', parsedAreas);
          setSelectedAreas(parsedAreas);
        } catch (e) {
          console.log('Không thể parse areas data');
        }
      }
    } catch (e) {
      console.log('Không thể load form data từ session storage:', e);
    }
  };

  // Sau khi cố gắng đọc từ session, nếu vẫn chưa có URL hợp lệ, fallback gọi previewId để lấy URL server
  useEffect(() => {
    const maybeHydrateFromPreview = async () => {
      if (!user?.id) return;
      const hasAvatar = !!sessionStorage.getItem(`agentAvatar_${user.id}`);
      const hasBanner = !!sessionStorage.getItem(`agentBanner_${user.id}`);
      const previewId = sessionStorage.getItem(`agentPreviewId_${user.id}`);
      if ((!hasAvatar || !hasBanner) && previewId) {
        try {
          const res = await axiosPrivate.get(`/api/agent-profile/preview/${previewId}`);
          const data = res.data || {};
          if (data.avatarUrl) {
            sessionStorage.setItem(`agentServerAvatar_${user.id}`, data.avatarUrl);
            sessionStorage.setItem(`agentAvatar_${user.id}`, data.avatarUrl);
            setAvatarPreview(data.avatarUrl);
          }
          if (data.bannerUrl) {
            sessionStorage.setItem(`agentServerBanner_${user.id}`, data.bannerUrl);
            sessionStorage.setItem(`agentBanner_${user.id}`, data.bannerUrl);
            setBannerPreview(data.bannerUrl);
          }
        } catch (_) {}
      }
    };
    maybeHydrateFromPreview();
  }, [user]);

  // Save form data to sessionStorage
  const saveFormDataToSession = (formData) => {
    if (user?.id) {
      sessionStorage.setItem(`agentForm_${user.id}`, JSON.stringify(formData));
    }
  };

  // Save avatar/banner preview to sessionStorage
  const savePreviewToSession = (type, url) => {
    if (user?.id) {
      sessionStorage.setItem(`agent${type}_${user.id}`, url);
      console.log(`Saved ${type} preview to session:`, url);
    }
  };

  // Save selected areas to sessionStorage
  const saveAreasToSession = (areas) => {
    if (user?.id) {
      sessionStorage.setItem(`agentAreas_${user.id}`, JSON.stringify(areas));
    }
  };

  // Clear sessionStorage
  const clearSessionStorage = () => {
    if (user?.id) {
      sessionStorage.removeItem(`agentForm_${user.id}`);
      sessionStorage.removeItem(`agentAvatar_${user.id}`);
      sessionStorage.removeItem(`agentBanner_${user.id}`);
      sessionStorage.removeItem(`agentAreas_${user.id}`);
    }
  };

  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj || (info.fileList[0] && info.fileList[0].originFileObj);
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      savePreviewToSession('Avatar', previewUrl);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
      if (user?.id) {
        sessionStorage.removeItem(`agentAvatar_${user.id}`);
      }
    }
  };

  const handleBannerChange = (info) => {
    const file = info.file.originFileObj || (info.fileList[0] && info.fileList[0].originFileObj);
    if (file) {
      setBannerFile(file);
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
      savePreviewToSession('Banner', previewUrl);
    } else {
      setBannerFile(null);
      setBannerPreview(null);
      if (user?.id) {
        sessionStorage.removeItem(`agentBanner_${user.id}`);
      }
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      console.log('Form values:', values);
      console.log('Selected areas:', selectedAreas);
      
      if (!values.categoryTransactionTypes || values.categoryTransactionTypes.length === 0) {
        message.error('Vui lòng thêm ít nhất một loại hình môi giới!');
        setSubmitting(false);
        return;
      }
      
      if (selectedAreas.length === 0) {
        message.error('Vui lòng chọn ít nhất một khu vực môi giới.');
        setSubmitting(false);
        return;
      }
      
      // Kiểm tra từng loại hình có đủ trường không
      for (const [idx, item] of values.categoryTransactionTypes.entries()) {
        if (!item.categoryId || !item.transactionTypes || (Array.isArray(item.transactionTypes) && item.transactionTypes.length === 0)) {
          message.error(`Loại hình môi giới số ${idx + 1} chưa đủ thông tin!`);
          setSubmitting(false);
          return;
        }
      }
      
      const postData = new FormData();
      postData.append('ShopName', values.shopName);
      postData.append('Description', values.description || '');
      postData.append('Address', values.address || '');
      postData.append('Slug', values.slug);
      postData.append('PhoneNumber', values.phoneNumber);
      
      selectedAreas.forEach(area => postData.append('AreaIds', area.id));
      
      values.categoryTransactionTypes.forEach(item => {
        postData.append('CategoryIds', item.categoryId);
        (Array.isArray(item.transactionTypes) ? item.transactionTypes : [item.transactionTypes]).forEach(type => postData.append('TransactionTypes', type));
      });
      
      // Chỉ gửi file khi có file mới được chọn
      if (avatarFile) {
        postData.append('AvatarUrl', avatarFile);
        console.log('Sending new avatar file');
      } else {
        // Nếu không có file mới, gửi URL hiện tại (ưu tiên server URL)
        const serverAvatarUrl = sessionStorage.getItem(`agentServerAvatar_${user.id}`);
        const currentAvatarUrl = serverAvatarUrl || sessionStorage.getItem(`agentAvatar_${user.id}`);
        if (currentAvatarUrl && !currentAvatarUrl.startsWith('blob:')) {
          // Nếu là URL thật, gửi lại
          postData.append('AvatarUrl', currentAvatarUrl);
          console.log('Sending existing avatar URL:', currentAvatarUrl);
        } else {
          console.log('Keeping existing avatar URL from preview');
        }
      }
      
      if (bannerFile) {
        postData.append('BannerUrl', bannerFile);
        console.log('Sending new banner file');
      } else {
        // Nếu không có file mới, gửi URL hiện tại (ưu tiên server URL)
        const serverBannerUrl = sessionStorage.getItem(`agentServerBanner_${user.id}`);
        const currentBannerUrl = serverBannerUrl || sessionStorage.getItem(`agentBanner_${user.id}`);
        if (currentBannerUrl && !currentBannerUrl.startsWith('blob:')) {
          // Nếu là URL thật, gửi lại
          postData.append('BannerUrl', currentBannerUrl);
          console.log('Sending existing banner URL:', currentBannerUrl);
        } else {
          console.log('Keeping existing banner URL from preview');
        }
      }
      
      console.log('Dữ liệu gửi lên:', Object.fromEntries(postData.entries()));
      
      const response = await axiosPrivate.post('/api/agent-profile/preview', postData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('API response:', response.data);
      
      if (response.data && response.data.previewId) {
        message.success('Tạo bản xem trước thành công! Đang chuyển trang...');
        
        // Log để debug
        console.log('Preview created with ID:', response.data.previewId);
        console.log('Form data sent:', Object.fromEntries(postData.entries()));
        console.log('Avatar file:', avatarFile);
        console.log('Banner file:', bannerFile);
        
        // Lưu previewId để lần quay lại có thể giữ URL ảnh server
        if (user?.id) {
          sessionStorage.setItem(`agentPreviewId_${user.id}`, response.data.previewId);
        }

        // KHÔNG xóa sessionStorage để user có thể quay về chỉnh sửa
        navigate(`/agent-profile/preview/${response.data.previewId}`);
      } else {
        throw new Error('Không nhận được ID xem trước từ server!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.title || err.response?.data || err.message || 'Đã xảy ra lỗi khi tạo bản xem trước.';
      console.error('API error:', errorMsg);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Banner Section */}
      <div style={{ 
        position: 'relative', 
        height: '300px', 
        backgroundImage: bannerPreview ? `url(${bannerPreview.startsWith('http') ? bannerPreview : `http://localhost:5134${bannerPreview}`})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 24px 24px 24px'
      }}>
        {/* Banner Upload Overlay */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10
        }}>
          <Upload
            name="banner"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleBannerChange}
            maxCount={1}
          >
            <Button 
              type="primary" 
              icon={<CameraOutlined />}
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Thay ảnh bìa
            </Button>
          </Upload>
        </div>

        {/* Avatar Section */}
        <div style={{
          position: 'relative',
          marginRight: '24px'
        }}>
          <Upload
            name="avatar"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleAvatarChange}
            maxCount={1}
          >
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid #fff',
              backgroundImage: avatarPreview ? `url(${avatarPreview.startsWith('http') ? avatarPreview : `http://localhost:5134${avatarPreview}`})` : 'none',
              backgroundColor: avatarPreview ? 'transparent' : '#e1e5e9',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {!avatarPreview && (
                <UserOutlined style={{ fontSize: '48px', color: '#999' }} />
              )}
              {/* Camera Icon Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #fff',
                cursor: 'pointer'
              }}>
                <CameraOutlined style={{ color: '#fff', fontSize: '16px' }} />
              </div>
            </div>
          </Upload>
        </div>

        {/* Shop Name Placeholder */}
        <div style={{ color: '#fff', marginBottom: '16px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {form.getFieldValue('shopName') || 'Tên chuyên trang'}
          </h1>
          <p style={{ 
            fontSize: '16px', 
            margin: '8px 0 0 0',
            opacity: 0.9,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {form.getFieldValue('description') || 'Mô tả chuyên trang'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <Row gutter={24}>
          {/* Main Form Column */}
          <Col xs={24} lg={24}>
            <Card style={{ marginBottom: '24px' }}>
              <h2 style={{ marginBottom: '32px', fontSize: '24px', fontWeight: '600', textAlign: 'center' }}>Thông tin chuyên trang</h2>
              
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={onFinish} 
                onValuesChange={(changedValues, allValues) => {
                  saveFormDataToSession(allValues);
                }}
              >
                {/* Basic Information Section */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#1890ff', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
                    Thông tin cơ bản
                  </h3>
                  
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item 
                        name="shopName" 
                        label={<span style={{ fontWeight: '600' }}>Tên chuyên trang *</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập tên chuyên trang!' }]}
                      >
                        <Input placeholder="Nhập tên chuyên trang" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item 
                        name="slug" 
                        label={<span style={{ fontWeight: '600' }}>Đường dẫn *</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập đường dẫn!' }]}
                      >
                        <Input placeholder="realestatehub.com/moi-gioi-..." size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="description" 
                    label={<span style={{ fontWeight: '600' }}>Giới thiệu</span>}
                  >
                    <TextArea rows={4} placeholder="Mô tả về chuyên trang của bạn..." />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item 
                        name="address" 
                        label={<span style={{ fontWeight: '600' }}>Địa chỉ</span>}
                      >
                        <Input placeholder="Nhập địa chỉ chi tiết" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item 
                        name="phoneNumber" 
                        label={<span style={{ fontWeight: '600' }}>Số điện thoại *</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                      >
                        <Input placeholder="Nhập số điện thoại" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider />

                {/* Operating Areas Section */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#1890ff', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
                    Khu vực hoạt động
                  </h3>
                  
                  <Form.Item>
                    <Button
                      onClick={() => setIsModalVisible(true)}
                      type="dashed"
                      size="large"
                      icon={<PlusOutlined />}
                      style={{ 
                        marginBottom: 16, 
                        width: '100%', 
                        height: '48px',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      {selectedAreas.length === 0 ? 'Chọn khu vực hoạt động' : 'Chọn lại khu vực'}
                    </Button>
                    <div style={{ minHeight: '40px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px', background: '#fafafa' }}>
                      {selectedAreas.length === 0 ? (
                        <span style={{ color: '#999', fontSize: '14px' }}>Chưa chọn khu vực nào</span>
                      ) : (
                        selectedAreas.map(area => (
                          <Tag key={area.id} color="blue" style={{ marginBottom: 8, marginRight: 8, padding: '6px 12px', fontSize: '14px' }}>
                            {area.name} ({area.city?.name})
                          </Tag>
                        ))
                      )}
                    </div>
                  </Form.Item>
                </div>

                <Divider />

                {/* Brokerage Types Section */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#1890ff', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
                    Loại hình môi giới
                  </h3>
                  
                  <Form.List name="categoryTransactionTypes">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, idx) => (
                          <Card
                            key={key}
                            style={{ 
                              marginBottom: 20, 
                              border: '1px solid #e8e8e8',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                            size="small"
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginBottom: 20,
                              paddingBottom: '12px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <h4 style={{ 
                                margin: 0, 
                                fontSize: '18px', 
                                fontWeight: '600',
                                color: '#1890ff'
                              }}>
                                Loại hình {idx + 1}
                              </h4>
                              <Button 
                                danger 
                                type="text" 
                                icon={<PlusOutlined />} 
                                onClick={() => remove(name)}
                                disabled={fields.length === 1}
                                style={{ fontSize: '14px' }}
                              >
                                Xóa
                              </Button>
                            </div>
                            
                            <Row gutter={24}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'transactionTypes']}
                                  label={<span style={{ fontWeight: '600' }}>Loại giao dịch *</span>}
                                  rules={[{ required: true, message: 'Vui lòng chọn loại giao dịch!' }]}
                                >
                                  <Radio.Group optionType="button" buttonStyle="solid" size="large">
                                    <Radio value="0">Mua bán</Radio>
                                    <Radio value="1">Cho thuê</Radio>
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'categoryId']}
                                  label={<span style={{ fontWeight: '600' }}>Loại bất động sản *</span>}
                                  rules={[{ required: true, message: 'Vui lòng chọn loại BĐS!' }]}
                                >
                                  <Select
                                    placeholder="Chọn loại bất động sản"
                                    size="large"
                                    showSearch
                                    optionFilterProp="children"
                                  >
                                    {categories.map(category => (
                                      <Option key={category.id} value={category.id}>{category.name}</Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => {
                              if (fields.length < 3) add();
                              else message.warning('Bạn chỉ có thể nhập tối đa 3 loại hình môi giới!');
                            }}
                            block
                            icon={<PlusOutlined />}
                            size="large"
                            style={{ 
                              height: '48px',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}
                          >
                            Thêm loại hình môi giới
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </div>

                <Divider />

                {/* Submit Section */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={submitting} 
                      size="large"
                      style={{ 
                        height: '56px', 
                        padding: '0 64px',
                        fontSize: '18px',
                        fontWeight: '600',
                        borderRadius: '8px'
                      }}
                    >
                      {submitting ? 'Đang xử lý...' : 'Tạo chuyên trang'}
                    </Button>
                  </Form.Item>
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>
                    * Vui lòng điền đầy đủ thông tin bắt buộc
                  </p>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>

      <AreaSelectionModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onOk={areas => {
            setSelectedAreas(areas);
            saveAreasToSession(areas);
            setIsModalVisible(false);
        }}
        initialSelectedAreas={selectedAreas}
      />
    </div>
  );
}
