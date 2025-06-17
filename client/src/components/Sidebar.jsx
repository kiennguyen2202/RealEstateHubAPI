import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map as MapIcon } from '@mui/icons-material';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/users', icon: <UserOutlined />, label: 'Người dùng' },
    { key: '/admin/posts', icon: <FileTextOutlined />, label: 'Bài viết' },
    { key: '/admin/reports', icon: <ExclamationCircleOutlined />, label: 'Báo cáo' },
    { key: '/admin/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
    { key: '/admin/areas', icon: <MapIcon />, label: 'Khu vực' },
  ];

  return (
    <Sider theme="dark" width={230} style={{ minHeight: '100vh', marginLeft: -30 }}>
      <div className="logo" style={{ color: '#fff', fontWeight: 'bold', fontSize: 24, padding: 36 }}>Admin</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar; 