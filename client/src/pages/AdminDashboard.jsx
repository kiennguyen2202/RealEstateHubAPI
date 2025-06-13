import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Card, Statistic, Spin, message } from 'antd';
import Sidebar from '../components/Sidebar';
import axiosPrivate from '../api/axiosPrivate';
import { toast } from 'react-toastify';


const { Content } = Layout;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'User'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosPrivate.get('/api/admin/stats');
        setStats(res.data);
      } catch {
        message.error('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh'}}>
      <Sidebar selectedKey="/admin" />
      <Layout>
        <Content style={{ margin: '24px 16px 0px', background: '#141414'}}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
          {loading ? (
            <Spin size="large" />
          ) : (
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic title="Tổng người dùng" value={stats.totalUsers} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Tổng bài viết" value={stats.totalPosts} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Báo cáo" value={stats.totalReports} valueStyle={{ color: '#faad14' }} />
                </Card>
              </Col>
            </Row>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard; 