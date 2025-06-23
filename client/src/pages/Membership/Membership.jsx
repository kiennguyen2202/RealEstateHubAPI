import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Modal, message } from 'antd';
import Sidebar from '../../components/Sidebar';
import axiosPrivate from '../../api/axiosPrivate';

const { Content } = Layout;

const Membership = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosPrivate.get('/api/admin/payment-confirmations');
      setData(res.data);
    } catch {
      message.error('Không thể tải danh sách giao dịch Membership');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: auto reload mỗi 30s
    // const interval = setInterval(fetchData, 30000);
    // return () => clearInterval(interval);
  }, []);

  // const handleChangeRole = async (userId) => {
  //   try {
  //     await axiosPrivate.put(`/api/admin/users/${userId}/role`, { role: 'Membership' });
  //     message.success('Đã đổi role Membership thành công!');
  //     fetchData();
  //   } catch (err) {
  //     message.error('Đổi role Membership thất bại!');
  //   }
  // };

  const columns = [
    { title: 'Họ tên', dataIndex: 'name', key: 'name' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phương thức', dataIndex: 'paymentMethod', key: 'paymentMethod' },
    {
      title: 'Ảnh biên nhận',
      dataIndex: 'receiptUrl',
      key: 'receiptUrl',
      render: url => url ? (
        <img
          src={`http://localhost:5134${url}`}
          alt="receipt"
          style={{ width: 60, height: 60, objectFit: 'cover', cursor: 'pointer', borderRadius: 6, border: '1px solid #eee' }}
          onClick={() => setPreviewImg(`http://localhost:5134${url}`)}
        />
      ) : 'Không có'
    },
    { title: 'Ngày gửi', dataIndex: 'createdAt', key: 'createdAt', render: v => new Date(v).toLocaleString() },
    
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar selectedKey="/admin/membership" />
      <Layout>
        <Content style={{ margin: '24px 16px 0', background: '#141414' }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản lý Membership</h1>
          <Button onClick={fetchData} style={{ marginBottom: 16 }}>Tải lại danh sách</Button>
          <Table columns={columns} dataSource={data} loading={loading} rowKey="id" style={{ marginTop: 8 }} />
          <Modal open={!!previewImg} footer={null} onCancel={() => setPreviewImg(null)} centered>
            <img src={previewImg} alt="receipt-large" style={{ width: '100%' }} />
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Membership; 