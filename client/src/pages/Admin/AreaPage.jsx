import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import Sidebar from '../../components/Sidebar';
import axiosPrivate from '../../api/axiosPrivate';

const { Content } = Layout;
const { Option } = Select;

const AreaPage = () => {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedArea, setSelectedArea] = useState('city'); // 'city', 'district', 'ward'
  const [modal, setModal] = useState({ open: false, edit: null });
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [citiesRes, districtsRes, wardsRes] = await Promise.all([
        axiosPrivate.get('/api/admin/cities'),
        axiosPrivate.get('/api/admin/districts'),
        axiosPrivate.get('/api/admin/wards'),
      ]);
      setCities(citiesRes.data);
      setDistricts(districtsRes.data);
      setWards(wardsRes.data);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal open/close
  const handleAdd = (type) => {
    setSelectedArea(type);
    setModal({ open: true, edit: null });
    form.resetFields();
  };

  const handleEdit = (type, record) => {
    setSelectedArea(type);
    setModal({ open: true, edit: record });
    if (type === 'city') {
      form.setFieldsValue({ name: record.name });
    } else if (type === 'district') {
      form.setFieldsValue({ name: record.name, cityId: record.cityId });
    } else if (type === 'ward') {
      form.setFieldsValue({ name: record.name, districtId: record.districtId });
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      try {
        if (type === 'city') await axiosPrivate.delete(`/api/admin/cities/${id}`);
        if (type === 'district') await axiosPrivate.delete(`/api/admin/districts/${id}`);
        if (type === 'ward') await axiosPrivate.delete(`/api/admin/wards/${id}`);
        message.success('Đã xóa thành công');
        fetchData();
      } catch (error) {
        message.error('Lỗi khi xóa');
      }
    }
  };

  // Modal OK
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (modal.edit) {
        // Edit
        if (selectedArea === 'city') {
          await axiosPrivate.put(`/api/admin/cities/${modal.edit.id}`, { name: values.name });
        } else if (selectedArea === 'district') {
          await axiosPrivate.put(`/api/admin/districts/${modal.edit.id}`, { name: values.name, cityId: values.cityId });
        } else if (selectedArea === 'ward') {
          await axiosPrivate.put(`/api/admin/wards/${modal.edit.id}`, { name: values.name, districtId: values.districtId });
        }
        message.success('Cập nhật thành công');
      } else {
        // Add
        if (selectedArea === 'city') {
          await axiosPrivate.post('/api/admin/cities', { name: values.name });
        } else if (selectedArea === 'district') {
          await axiosPrivate.post('/api/admin/districts', { name: values.name, cityId: values.cityId });
        } else if (selectedArea === 'ward') {
          await axiosPrivate.post('/api/admin/wards', { name: values.name, districtId: values.districtId });
        }
        message.success('Thêm mới thành công');
      }
      setModal({ open: false, edit: null });
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Lỗi khi thao tác');
    }
  };

  // Table columns
  const cityColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên thành phố', dataIndex: 'name', key: 'name' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit('city', record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id, 'city')}>Xóa</Button>
        </Space>
      ),
    },
  ];

  const districtColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên quận/huyện', dataIndex: 'name', key: 'name' },
    { title: 'Thành phố', dataIndex: ['city', 'name'], key: 'city' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit('district', record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id, 'district')}>Xóa</Button>
        </Space>
      ),
    },
  ];

  const wardColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên phường/xã', dataIndex: 'name', key: 'name' },
    { title: 'Quận/Huyện', dataIndex: ['district', 'name'], key: 'district' },
    { title: 'Thành phố', dataIndex: ['district', 'city', 'name'], key: 'city' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit('ward', record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id, 'ward')}>Xóa</Button>
        </Space>
      ),
    },
  ];

  // Render table by selectedArea
  const renderTable = () => {
    if (selectedArea === 'city') {
      return <Table columns={cityColumns} dataSource={cities} loading={loading} rowKey="id" />;
    }
    if (selectedArea === 'district') {
      return <Table columns={districtColumns} dataSource={districts} loading={loading} rowKey="id" />;
    }
    if (selectedArea === 'ward') {
      return <Table columns={wardColumns} dataSource={wards} loading={loading} rowKey="id" />;
    }
    return null;
  };

  // Modal form fields
  const renderFormFields = () => {
    if (selectedArea === 'city') {
      return (
        <Form.Item name="name" label="Tên thành phố" rules={[{ required: true, message: 'Nhập tên thành phố' }]}>
          <Input />
        </Form.Item>
      );
    }
    if (selectedArea === 'district') {
      return (
        <>
          <Form.Item name="name" label="Tên quận/huyện" rules={[{ required: true, message: 'Nhập tên quận/huyện' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cityId" label="Thành phố" rules={[{ required: true, message: 'Chọn thành phố' }]}>
            <Select>
              {cities.map(city => (
                <Option key={city.id} value={city.id}>{city.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </>
      );
    }
    if (selectedArea === 'ward') {
      return (
        <>
          <Form.Item name="name" label="Tên phường/xã" rules={[{ required: true, message: 'Nhập tên phường/xã' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="districtId" label="Quận/Huyện" rules={[{ required: true, message: 'Chọn quận/huyện' }]}>
            <Select>
              {districts.map(district => (
                <Option key={district.id} value={district.id}>
                  {district.name} - {district.city.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </>
      );
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar selectedKey="/admin/area" />
      <Layout>
        <Content style={{ margin: '24px 16px 0', background: '#141414' }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản lý khu vực</h1>
          <Space style={{ marginBottom: 16 }}>
            <Button type={selectedArea === 'city' ? 'primary' : 'default'} onClick={() => setSelectedArea('city')}>Thành phố</Button>
            <Button type={selectedArea === 'district' ? 'primary' : 'default'} onClick={() => setSelectedArea('district')}>Quận/Huyện</Button>
            <Button type={selectedArea === 'ward' ? 'primary' : 'default'} onClick={() => setSelectedArea('ward')}>Phường/Xã</Button>
            <Button type="primary" onClick={() => handleAdd(selectedArea)}>Thêm {selectedArea === 'city' ? 'thành phố' : selectedArea === 'district' ? 'quận/huyện' : 'phường/xã'}</Button>
          </Space>
          {renderTable()}
          <Modal
            open={modal.open}
            onCancel={() => { setModal({ open: false, edit: null }); form.resetFields(); }}
            onOk={handleOk}
            title={
              modal.edit
                ? selectedArea === 'city'
                  ? 'Sửa thành phố'
                  : selectedArea === 'district'
                  ? 'Sửa quận/huyện'
                  : 'Sửa phường/xã'
                : selectedArea === 'city'
                ? 'Thêm thành phố mới'
                : selectedArea === 'district'
                ? 'Thêm quận/huyện mới'
                : 'Thêm phường/xã mới'
            }
            okText={modal.edit ? 'Cập nhật' : 'Thêm'}
          >
            <Form form={form} layout="vertical">
              {renderFormFields()}
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AreaPage;