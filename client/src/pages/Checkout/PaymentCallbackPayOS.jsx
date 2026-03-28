import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Typography, Card, Divider, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, HomeOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate';
import { useAuth } from '../../auth/AuthContext';
import './PaymentCallbackVnpay.css';

const { Text, Title } = Typography;

const PaymentCallbackPayOS = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [agentProfileId, setAgentProfileId] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const response = await axiosPrivate.get(`/api/payment/payos-return${window.location.search}`);
        console.log('PayOS response:', response.data);
        setResult(response.data);

        if (response.data?.success && user) {
          if (typeof refreshUser === 'function') {
            await refreshUser();
          }

          const orderInfo = response.data?.orderInfo || '';
          const isAgentPayment = orderInfo.includes('type=agent_profile') || orderInfo.includes('previewId=');
          
          await createPaymentNotification(user.id, isAgentPayment, orderInfo);
          
          if (response.data?.agentProfileId) {
            setAgentProfileId(response.data.agentProfileId);
          }

          message.success('Thanh toán thành công!');
        }
      } catch (error) {
        console.error('PayOS error:', error);
        setResult({ success: false, error: error.message });
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, []);

  const createPaymentNotification = async (userId, isAgentPayment, orderInfo) => {
    try {
      const planMatch = orderInfo.match(/plan=([^;]+)/);
      const plan = planMatch ? planMatch[1] : 'pro_month';
      
      const planNames = {
        'pro_month': 'Pro 1 Tháng',
        'pro_quarter': 'Pro 3 Tháng', 
        'pro_year': 'Pro 12 Tháng',
        'basic': 'Gói Cơ Bản',
        'premium': 'Gói Cao Cấp'
      };

      const notification = isAgentPayment ? {
        userId,
        title: 'Tạo chuyên trang môi giới thành công! 🏠',
        message: 'Chuyên trang môi giới của bạn đã được tạo thành công!',
        type: 'agent_profile_created',
        isRead: false
      } : {
        userId,
        title: `Nâng cấp ${planNames[plan] || 'Membership'} thành công! 👑`,
        message: `Tài khoản của bạn đã được nâng cấp lên ${planNames[plan] || 'Membership'}!`,
        type: 'membership_upgrade',
        isRead: false
      };

      await axiosPrivate.post('/api/notifications', notification);
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const orderInfo = result?.orderInfo || '';
  const isAgentProfilePayment = orderInfo.includes('type=agent_profile') || !!result?.agentProfileId;

  const handleGoHome = () => navigate('/');
  const handleGoToProfile = () => navigate('/dashboard');
  const handleGoToAgentProfile = () => {
    navigate(agentProfileId ? `/agent-profile/${agentProfileId}` : '/agent-profile');
  };
  const handleRetry = () => {
    navigate(isAgentProfilePayment ? '/agent-checkout' : '/membership-checkout');
  };

  if (loading) {
    return (
      <div className="payment-callback-container">
        <div className="loading-section">
          <div className="loading-card">
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1677ff' }} spin />} />
            <Title level={4} style={{ marginTop: 24, color: '#1677ff' }}>Đang xác thực thanh toán...</Title>
          </div>
        </div>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div className="payment-callback-container">
        <div className="success-section">
          <Card className="result-card success-card">
            <div className="success-icon"><CheckCircleOutlined /></div>
            <Title level={2} className="success-title">Thanh toán thành công!</Title>
            <Divider />
            <div className="benefits-section">
              <Title level={4} style={{ color: '#52c41a' }}>
                {isAgentProfilePayment ? '🎉 Chuyên trang môi giới đã được tạo!' : '🎉 Tài khoản đã được nâng cấp!'}
              </Title>
            </div>
            <div className="action-buttons">
              {isAgentProfilePayment ? (
                <Button type="primary" size="large" icon={<UserOutlined />} onClick={handleGoToAgentProfile}>Xem chuyên trang</Button>
              ) : (
                <Button type="primary" size="large" icon={<UserOutlined />} onClick={handleGoToProfile}>Xem tài khoản</Button>
              )}
              <Button size="large" icon={<HomeOutlined />} onClick={handleGoHome}>Về trang chủ</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-callback-container">
      <div className="error-section">
        <Card className="result-card error-card">
          <div className="error-icon"><CloseCircleOutlined /></div>
          <Title level={2} className="error-title">Thanh toán thất bại</Title>
          <div className="action-buttons">
            <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={handleRetry}>Thử lại</Button>
            <Button size="large" icon={<HomeOutlined />} onClick={handleGoHome}>Về trang chủ</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallbackPayOS;
