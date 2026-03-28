import { useEffect, useState } from 'react';
import { Layout, Row, Col, Card, Statistic, Spin, message } from 'antd';
import { 
  UserOutlined, FileTextOutlined, WarningOutlined, 
  CheckCircleOutlined, DollarOutlined, TeamOutlined 
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import axiosPrivate from '../../api/axiosPrivate';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const { Content } = Layout;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosPrivate.get('/api/admin/stats/detailed');
        setStats(res.data);
      } catch {
        message.error('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff',
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1f1f1f',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1
      }
    },
    cutout: '65%'
  };

  // Posts by status chart
  const postsChartData = {
    labels: ['Đã duyệt', 'Chờ duyệt', 'Hết hạn'],
    datasets: [{
      data: stats ? [
        stats.posts.approved,
        stats.posts.pending,
        stats.posts.expired
      ] : [0, 0, 0],
      backgroundColor: ['#52c41a', '#faad14', '#8c8c8c'],
      borderColor: ['#52c41a', '#faad14', '#8c8c8c'],
      borderWidth: 0
    }]
  };

  // Users by role chart
  const usersChartData = {
    labels: ['Admin', 'Pro', 'Thường'],
    datasets: [{
      data: stats ? [
        stats.users.admin,
        stats.users.pro,
        stats.users.normal
      ] : [0, 0, 0],
      backgroundColor: ['#722ed1', '#1890ff', '#13c2c2'],
      borderWidth: 0
    }]
  };

  // Transaction type chart
  const transactionChartData = {
    labels: ['Bán', 'Cho thuê'],
    datasets: [{
      data: stats ? [
        stats.transactions.sale,
        stats.transactions.rent
      ] : [0, 0],
      backgroundColor: ['#eb2f96', '#52c41a'],
      borderWidth: 0
    }]
  };

  // Reports chart
  const reportsChartData = {
    labels: ['Đã xử lý', 'Chưa xử lý'],
    datasets: [{
      data: stats ? [
        stats.reports.handled,
        stats.reports.pending
      ] : [0, 0],
      backgroundColor: ['#52c41a', '#ff4d4f'],
      borderWidth: 0
    }]
  };

  // Payments chart
  const paymentsChartData = {
    labels: ['Thành công', 'Thất bại'],
    datasets: [{
      data: stats ? [
        stats.payments.success,
        stats.payments.failed
      ] : [0, 0],
      backgroundColor: ['#52c41a', '#ff4d4f'],
      borderWidth: 0
    }]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar selectedKey="/admin" />
      <Layout>
        <Content className="admin-dashboard-content">
          <h1 className="dashboard-title">Dashboard Quản Trị</h1>
          
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card blue">
                    <Statistic 
                      title={<span className="stat-title">Tổng bài đăng</span>}
                      value={stats?.posts.total || 0} 
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card green">
                    <Statistic 
                      title={<span className="stat-title">Tổng người dùng</span>}
                      value={stats?.users.total || 0}
                      prefix={<UserOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card yellow">
                    <Statistic 
                      title={<span className="stat-title">Chờ duyệt</span>}
                      value={stats?.posts.pending || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card red">
                    <Statistic 
                      title={<span className="stat-title">Báo cáo</span>}
                      value={stats?.reports.pending || 0}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card purple">
                    <Statistic 
                      title={<span className="stat-title">Môi giới</span>}
                      value={stats?.agents?.total || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Card className="stat-card cyan">
                    <Statistic 
                      title={<span className="stat-title">Doanh thu</span>}
                      value={stats?.payments.revenue || 0}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#13c2c2', fontSize: '18px' }}
                      suffix="đ"
                      formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Charts Row 1 */}
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12} lg={8}>
                  <Card className="chart-card">
                    <h3 className="chart-title">Trạng thái bài đăng</h3>
                    <div className="chart-container">
                      <Doughnut data={postsChartData} options={chartOptions} />
                    </div>
                    <div className="chart-center-text">
                      <span className="center-value">{stats?.posts.total || 0}</span>
                      <span className="center-label">Tổng</span>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Card className="chart-card">
                    <h3 className="chart-title">Phân loại người dùng</h3>
                    <div className="chart-container">
                      <Doughnut data={usersChartData} options={chartOptions} />
                    </div>
                    <div className="chart-center-text">
                      <span className="center-value">{stats?.users.total || 0}</span>
                      <span className="center-label">Tổng</span>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Card className="chart-card">
                    <h3 className="chart-title">Loại giao dịch</h3>
                    <div className="chart-container">
                      <Doughnut data={transactionChartData} options={chartOptions} />
                    </div>
                    <div className="chart-center-text">
                      <span className="center-value">{stats?.posts.total || 0}</span>
                      <span className="center-label">Tổng</span>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Charts Row 2 */}
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                  <Card className="chart-card">
                    <h3 className="chart-title">Báo cáo vi phạm</h3>
                    <div className="chart-container">
                      <Doughnut data={reportsChartData} options={chartOptions} />
                    </div>
                    <div className="chart-center-text">
                      <span className="center-value">{stats?.reports.total || 0}</span>
                      <span className="center-label">Tổng</span>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card className="chart-card">
                    <h3 className="chart-title">Thanh toán</h3>
                    <div className="chart-container">
                      <Doughnut data={paymentsChartData} options={chartOptions} />
                    </div>
                    <div className="chart-center-text">
                      <span className="center-value">{stats?.payments.total || 0}</span>
                      <span className="center-label">Tổng</span>
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
