import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const Sidebar = ({ selectedKey }) => {
  const navigate = useNavigate();
  return (
    <Sider theme="dark" width={230} style={{ minHeight: '100vh',marginLeft:-30 }}>
      <div className="logo" style={{ color: '#fff', fontWeight: 'bold', fontSize: 24, padding: 36 }}>Admin</div>
      <Menu
        
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => navigate(key)}
        items={[
          { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
          { key: '/admin/users', icon: <UserOutlined />, label: 'Người dùng' },
          { key: '/admin/posts', icon: <FileTextOutlined />, label: 'Bài viết' },
          { key: '/admin/reports', icon: <ExclamationCircleOutlined />, label: 'Báo cáo' },
          { key: '/admin/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
        ]}
      />
    </Sider>
  );
};

export default Sidebar; 