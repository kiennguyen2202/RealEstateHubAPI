import { Badge, Dropdown, List, message } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useState, useContext, useCallback } from 'react';
import axiosPrivate from '../api/axiosPrivate';
import { AuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';

const MAX_NOTIFICATIONS = 10; // Giới hạn hiển thị

// Use window object to persist across HMR reloads
if (!window.__notificationBellState) {
  window.__notificationBellState = {
    signalRConnection: null,
    signalRConnecting: false,
    receivedNotificationIds: new Set(),
    notificationHandlers: new Set()
  };
}

const bellState = window.__notificationBellState;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shake, setShake] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosPrivate.get(`api/notifications?userId=${user.id}`);
      setNotifications(res.data.slice(0, MAX_NOTIFICATIONS));
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    }
  }, [user]);

  // Setup SignalR - only once globally
  useEffect(() => {
    if (!user) return;
    
    // Create handler for this component instance
    const handleNotification = (notification) => {
      // Prevent duplicate notifications
      if (bellState.receivedNotificationIds.has(notification.id)) return;
      bellState.receivedNotificationIds.add(notification.id);
      
      // Cleanup old IDs
      if (bellState.receivedNotificationIds.size > 100) {
        const arr = Array.from(bellState.receivedNotificationIds);
        arr.slice(0, 50).forEach(id => bellState.receivedNotificationIds.delete(id));
      }
      
      console.log('🔔 Real-time notification:', notification);
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
      setUnreadCount(prev => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 1000);
    };

    // If already connected, just join group
    if (bellState.signalRConnection?.state === signalR.HubConnectionState.Connected) {
      bellState.signalRConnection.invoke('JoinUserGroup', user.id.toString()).catch(() => {});
      return;
    }
    
    // If already connecting, wait
    if (bellState.signalRConnecting) return;

    bellState.signalRConnecting = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/notificationHub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', handleNotification);

    connection.start()
      .then(() => {
        console.log('✅ SignalR Connected');
        bellState.signalRConnection = connection;
        return connection.invoke('JoinUserGroup', user.id.toString());
      })
      .then(() => console.log('✅ Joined group for user:', user.id))
      .catch(err => console.error('❌ SignalR Error:', err))
      .finally(() => { bellState.signalRConnecting = false; });

    return () => {
      // Don't disconnect - keep connection alive
    };
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [fetchNotifications]);

  const handleClick = async (item) => {
    await axiosPrivate.put(`api/notifications/${item.id}/mark-read`);
    fetchNotifications();

    const { postId, type, senderId } = item;
    // Message notification - navigate to chat with sender
    if (type === 'message' && senderId) {
      const chatUrl = postId ? `/chat?u=${senderId}&postId=${postId}` : `/chat?u=${senderId}`;
      navigate(chatUrl);
    }
    else if (type === 'expire' || type === 'expired') postId && navigate(`/chi-tiet/${postId}`);
    else if (type === 'membership_upgrade') navigate('/dashboard');
    else if (type === 'agent_profile_created') navigate('/agent-profile');
    else if (type === 'approved' && postId) navigate(`/chi-tiet/${postId}`);
    else if (postId) navigate(`/chi-tiet/${postId}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axiosPrivate.delete(`api/notifications/${id}`);
      fetchNotifications();
      message.success('Đã xóa thông báo!');
    } catch {
      message.error('Xóa thông báo thất bại!');
    }
  };

  const getIcon = (type) => {
    const icons = {
      message: '💬', expire: '⏰', expired: '❌', report: '👮',
      approved: '✅', payment_success: '💳', membership_upgrade: '👑', agent_profile_created: '🏠'
    };
    return icons[type] ? <span>{icons[type]}</span> : <BellOutlined />;
  };

  const dropdownContent = (
    <div style={{
      width: 360,
      maxHeight: 400,
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      background: '#fff',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 600,
        fontSize: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Thông báo</span>
        {unreadCount > 0 && (
          <span style={{ 
            background: '#ff4d4f', 
            color: '#fff', 
            padding: '2px 8px', 
            borderRadius: 10, 
            fontSize: 12 
          }}>
            {unreadCount} mới
          </span>
        )}
      </div>
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        <List
          dataSource={notifications}
          locale={{ emptyText: <div style={{ padding: 40, color: '#999', textAlign: 'center' }}>Không có thông báo</div> }}
          renderItem={item => (
            <div
              onClick={() => handleClick(item)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px 16px',
                cursor: 'pointer',
                background: item.isRead ? '#fff' : '#f0f7ff',
                borderBottom: '1px solid #f5f5f5',
                borderLeft: item.isRead ? '3px solid transparent' : '3px solid #1890ff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = item.isRead ? '#fff' : '#f0f7ff'}
            >
              <div style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: item.isRead ? 500 : 600, 
                  color: item.isRead ? '#666' : '#1890ff',
                  fontSize: 14,
                  marginBottom: 4
                }}>
                  {item.title}
                </div>
                <div style={{ 
                  color: '#666', 
                  fontSize: 13, 
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {item.message}
                </div>
              </div>
              <CloseOutlined
                onClick={(e) => handleDelete(e, item.id)}
                style={{ 
                  color: '#999', 
                  fontSize: 12, 
                  padding: 4,
                  marginLeft: 8,
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                onMouseLeave={e => e.currentTarget.style.color = '#999'}
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
      <Dropdown 
        dropdownRender={() => dropdownContent} 
        trigger={['click']} 
        placement="bottomRight"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined
            style={{
              fontSize: 22,
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
