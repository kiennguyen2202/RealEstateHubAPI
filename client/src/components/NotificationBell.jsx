import { Badge, Dropdown, List, message } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useContext } from 'react';
import axiosPrivate from '../api/axiosPrivate'; 
import { AuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5134/notificationHub')
      .build();
    connection.on('ReceiveNotification', (notification) => {
      console.log('Nhận notification real-time:', notification); // Debug
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 1000);
    });
    connection.start();
    return () => { connection.stop(); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axiosPrivate.get(`api/notifications?userId=${user.id}`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    }
  };

  const handleClick = async (id, postId, type, senderId) => {
    await axiosPrivate.put(`api/notifications/${id}/mark-read`);
    fetchNotifications();
    if (type === 'message' && senderId && postId) {
      navigate(`/messages?userId=${senderId}&postId=${postId}`);
    } else if ((type === 'expire' || type === 'expired') && postId) {
      navigate(`/chi-tiet/${postId}`);
    } else if (postId) {
      navigate(`/chi-tiet/${postId}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosPrivate.delete(`api/notifications/${id}`);
      fetchNotifications();
      message.success('Đã xóa thông báo!');
    } catch (error) {
      message.error('Xóa thông báo thất bại!');
    }
  };

  // Icon theo loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <span role="img" aria-label="message">💬</span>;
      case 'expire': return <span role="img" aria-label="expire">⏰</span>;
      case 'expired': return <span role="img" aria-label="expired">❌</span>;
      case 'report': return <span role="img" aria-label="report">👮</span>;
      case 'approved': return <span role="img" aria-label="approved">✅</span>;
      default: return <BellOutlined />;
    }
  };

  const notificationList = (
    <div
      style={{
        minWidth: 340,
        maxWidth: 400,
        padding: 0,
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        background: '#fff',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
      }}
    >
      <List
        dataSource={notifications}
        locale={{ emptyText: <div style={{ padding: 24, color: '#888' }}>Không có thông báo nào</div> }}
        renderItem={item => (
          <List.Item
            style={{
              backgroundColor: item.isRead ? '#fafafa' : '#e6f7ff',
              cursor: 'pointer',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              padding: '14px 18px',
              borderBottom: '1px solid #f0f0f0',
              transition: 'background 0.2s',
              borderLeft: item.isRead ? '4px solid transparent' : '4px solid #1890ff',
            }}
            actions={[
              <CloseOutlined
                key="delete"
                onClick={e => {
                  e.stopPropagation(); // Không trigger click vào notification
                  handleDelete(item.id);
                }}
                style={{ color: '#ff4d4f', fontSize: 16, cursor: 'pointer' }}
                title="Xóa thông báo"
              />
            ]}
            onClick={() => handleClick(item.id, item.postId, item.type, item.senderId)}
          >
            <List.Item.Meta
              avatar={getNotificationIcon(item.type)}
              title={
                <span style={{
                  fontWeight: 700,
                  color: item.isRead ? '#555' : '#1890ff',
                  fontSize: 15,
                  letterSpacing: 0.2,
                }}>
                  {item.title}
                </span>
              }
              description={
                <span style={{
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  color: '#333',
                  fontSize: 14,
                  marginTop: 4,
                  display: 'block',
                }}>
                  {item.message}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <>
      <style>
        {`
        @keyframes shake {
          0% { transform: rotate(0deg);}
          20% { transform: rotate(-15deg);}
          40% { transform: 10deg);}
          60% { transform: -10deg);}
          80% { transform: 5deg);}
          100% { transform: rotate(0deg);}
        }
        `}
      </style>
      <Dropdown overlay={notificationList} trigger={['click']} placement="bottomRight">
        <Badge count={unreadCount} size="small">
          <BellOutlined
            style={{
              fontSize: '24px',
              color: '#555',
              cursor: 'pointer',
              animation: shake ? 'shake 0.5s' : 'none'
            }}
          />
        </Badge>
      </Dropdown>
    </>
  );
};

export default NotificationBell;
