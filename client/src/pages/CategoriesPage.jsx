import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Space, Modal, Form, Input } from 'antd';
import Sidebar from '../components/Sidebar';
import axiosPrivate from '../api/axiosPrivate';
import MessageProvider from '../components/MessageProvider';

const { Content } = Layout;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, edit: null });
  const [form] = Form.useForm();
  const { showMessage, contextHolder } = MessageProvider();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosPrivate.get('/api/admin/categories');
        setCategories(res.data);
      } catch {
        showMessage.error('Không thể tải danh mục');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setModal({ open: true, edit: null });
    form.resetFields();
  };

  const handleEdit = (record) => {
    setModal({ open: true, edit: record });
    form.setFieldsValue({ name: record.name });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const response = await axiosPrivate.delete(`/api/admin/categories/${id}`);
        if (response.status === 200) {
          setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
          showMessage.success('Đã xóa danh mục thành công');
        }
      } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
        showMessage.error(error.response?.data || 'Không thể xóa danh mục');
      }
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      
      if (modal.edit) {
        // Sửa danh mục
        console.log('Editing category:', modal.edit);
        const response = await axiosPrivate.put(`/api/admin/categories/${modal.edit.id}`, {
          id: modal.edit.id,
          name: values.name,
          description: modal.edit.description || '',
          icon: modal.edit.icon || '',
          isActive: modal.edit.isActive
        });
        console.log('Update response:', response.data);
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat.id === modal.edit.id ? response.data : cat
          )
        );
        showMessage.success('Cập nhật danh mục thành công');
      } else {
        // Thêm danh mục mới
        console.log('Adding new category:', values);
        const response = await axiosPrivate.post('/api/admin/categories', {
          name: values.name,
          description: '',
          icon: '',
          isActive: true
        });
        console.log('Add response:', response.data);
        setCategories(prevCategories => [...prevCategories, response.data]);
        showMessage.success('Thêm danh mục thành công');
      }
      
      setModal({ open: false, edit: null });
      form.resetFields();
    } catch (error) {
      console.error('Lỗi khi thao tác với danh mục:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        showMessage.error(error.response.data?.title || 'Không thể thực hiện thao tác');
      } else {
        showMessage.error('Không thể thực hiện thao tác');
      }
    }
  };

  const columns = [
    { 
      title: 'Tên danh mục', 
      dataIndex: 'name', 
      key: 'name',
      render: (text) => <span style={{ color: '#fff' }}>{text}</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id)}>Xóa</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sidebar selectedKey="/admin/categories" />
      <Layout>
        <Content style={{ margin: '24px 16px 0', background: '#141414' }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản lý danh mục</h1>
          <Button type="primary" style={{ marginBottom: 16 }} onClick={handleAdd}>Thêm danh mục</Button>
          <Table columns={columns} dataSource={categories} loading={loading} rowKey="id" style={{ marginTop: 12 }} />
          <Modal open={modal.open} onCancel={() => setModal({ open: false, edit: null })} onOk={handleOk} title={modal.edit ? 'Sửa danh mục' : 'Thêm danh mục'}>
            <Form form={form} layout="vertical">
              <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}> 
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CategoriesPage; 