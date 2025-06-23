import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Tag, Space, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import axiosPrivate from '../../api/axiosPrivate';
import MessageProvider from '../../components/MessageProvider';

const { Content } = Layout;

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const { showMessage, contextHolder } = MessageProvider();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axiosPrivate.get('/api/admin/reports');
        setReports(res.data);
      } catch {
        showMessage.error('Không thể tải danh sách báo cáo');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        const response = await axiosPrivate.delete(`/api/admin/posts/${Number(postId)}`);
        if (response.status === 200) {
          setReports(reports => reports.filter(r => r.post.id !== postId));
          showMessage.success('Đã xoá bài viết thành công');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        showMessage.error(error.response?.data || 'Không thể xóa bài viết');
      }
    }
  };

  const columns = [
    { title: 'Bài viết', dataIndex: ['post', 'title'], key: 'post' },
    { title: 'Người báo cáo', dataIndex: ['user', 'name'], key: 'user' },
    { title: 'Số điện thoại', dataIndex: ['user', 'phone'], key: 'phone' },
    { title: 'Lý do', dataIndex: 'type', key: 'type', render: type => {
      console.log('Lý do báo cáo:', type);
      return <Tag color="red">{type}</Tag>;
    } },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        console.log(`Rendering action column for report ID: ${record.id}`);
        return (
          <Space>
            
            <Button icon={<EyeOutlined />} onClick={() => setDetail(record)}/>
            <Button danger onClick={() => handleDeletePost(record.post.id)}>Xoá bài viết</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sidebar selectedKey="/admin/reports" />
      <Layout>
        <Content style={{ margin: '24px 16px 0', background: '#141414' }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản lý báo cáo</h1>
          <Table columns={columns} dataSource={reports} loading={loading} rowKey="id" style={{ marginTop: 24 }} />
          <Modal open={!!detail} onCancel={() => setDetail(null)} footer={null} title="Chi tiết báo cáo">
            {detail && (
              <>
                {console.log('Detail data:', detail)}
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Bài viết">{detail.post?.title}</Descriptions.Item>
                  <Descriptions.Item label="Người báo cáo">{detail.user?.name}</Descriptions.Item>
                  <Descriptions.Item label="Lý do">{detail.type}</Descriptions.Item>
                  <Descriptions.Item label="Mô tả chi tiết">{detail.other || 'Không có mô tả'}</Descriptions.Item>
                  <Descriptions.Item label="Thời gian">{detail.createdReport}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{detail.phone}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsPage; 