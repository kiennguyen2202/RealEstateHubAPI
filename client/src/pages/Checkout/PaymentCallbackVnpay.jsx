import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Typography, Card, Divider, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, HomeOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate';
import { useAuth } from '../../auth/AuthContext';
import './PaymentCallbackVnpay.css';

const { Text, Title } = Typography;

const PaymentCallbackVnpay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [agentProfileId, setAgentProfileId] = useState(null);
  const hasProcessedRef = useRef(false); // Prevent double processing

  // Detect payment method
  const isMoMoPayment = window.location.search.includes('resultCode');
  const isPayOS = window.location.search.includes('orderCode');

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processPayment = async () => {
      try {
        // Call backend to validate payment
        let response;
        if (isMoMoPayment) {
          response = await axiosPrivate.get(`/api/payment/momo-return${window.location.search}`);
        } else if (isPayOS) {
          response = await axiosPrivate.get(`/api/payment/payos-return${window.location.search}`);
        } else {
          response = await axiosPrivate.get(`/api/payment/vnpay-return${window.location.search}`);
        }

        console.log('Payment response:', response.data);
        setResult(response.data);

        // Check if payment successful
        const isSuccess = checkPaymentSuccess(response.data);
        console.log('Payment success:', isSuccess, 'User:', user);
        
        if (isSuccess) {
          // Refresh user to get updated role
          if (typeof refreshUser === 'function') {
            await refreshUser();
          }

          // Get userId from response or current user
          const orderInfo = response.data?.orderInfo || response.data?.OrderInfo || '';
          
          // Determine payment type - chỉ là agent profile nếu orderInfo chứa type=agent_profile hoặc previewId có giá trị thực
          const hasValidPreviewId = orderInfo.includes('previewId=') && 
            !orderInfo.includes('previewId=;') && 
            !orderInfo.includes('previewId=null') &&
            !orderInfo.includes('previewId=undefined');
          const isAgentPayment = orderInfo.includes('type=agent_profile') || hasValidPreviewId;
          
          if (response.data?.agentProfileId && isAgentPayment) {
            setAgentProfileId(response.data.agentProfileId);
          }

          // Trigger refresh notifications (backend đã tạo notification rồi)
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);

          message.success('Thanh toán thành công!');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setResult({ success: false, error: error.message });
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  const checkPaymentSuccess = (data) => {
    if (!data) return false;
    
    // VNPay
    if (data.vnPayResponseCode === '00' && data.success === true) return true;
    
    // MoMo
    if (data.resultCode === '0' || data.resultCode === 0) return true;
    
    // PayOS
    if (data.success === true && data.code === '00') return true;
    
    // Generic
    if (data.success === true) return true;
    
    return false;
  };

  // Determine payment type - chỉ là agent profile nếu orderInfo chứa type=agent_profile hoặc previewId
  const orderInfo = result?.orderInfo || result?.OrderInfo || '';
  const isAgentProfilePayment = orderInfo.includes('type=agent_profile') || 
    (orderInfo.includes('previewId=') && !orderInfo.includes('previewId=;') && !orderInfo.includes('previewId=null'));

  // Extract plan info
  const planMatch = orderInfo.match(/plan=([^;]+)/);
  const plan = planMatch ? planMatch[1] : null;
  
  const planDetails = {
    'pro_month': { name: 'Pro 1 Tháng', price: 199000 },
    'pro_quarter': { name: 'Pro 3 Tháng', price: 549000 },
    'pro_year': { name: 'Pro 12 Tháng', price: 1990000 },
    'basic': { name: 'Gói Cơ Bản', price: 500000 },
    'premium': { name: 'Gói Cao Cấp', price: 1000000 }
  }[plan];

  const handleGoHome = () => navigate('/');
  const handleGoToProfile = () => navigate('/dashboard');
  const handleGoToAgentProfile = () => {
    if (agentProfileId) {
      navigate(`/agent-profile/${agentProfileId}`);
    } else {
      navigate('/agent-profile');
    }
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
            <Title level={4} style={{ marginTop: 24, color: '#1677ff' }}>
              Đang xác thực thanh toán...
            </Title>
            <Text type="secondary">Vui lòng chờ trong giây lát</Text>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = checkPaymentSuccess(result);

  if (isPaymentSuccessful) {
    return (
      <div className="payment-callback-container">
        <div className="success-section">
          <Card className="result-card success-card">
            <div className="success-icon">
              <CheckCircleOutlined />
            </div>
            <Title level={2} className="success-title">
              Thanh toán thành công!
            </Title>
            <div className="success-details">
              <div className="detail-item">
                <Text strong>Trạng thái:</Text>
                <Text type="success" strong> Hoàn tất</Text>
              </div>
              <div className="detail-item">
                <Text strong>Phương thức:</Text>
                <Text> {isMoMoPayment ? 'MoMo' : isPayOS ? 'PayOS' : 'VNPAY'}</Text>
              </div>
              {planDetails && (
                <>
                  <div className="detail-item">
                    <Text strong>Gói dịch vụ:</Text>
                    <Text> {planDetails.name}</Text>
                  </div>
                  <div className="detail-item">
                    <Text strong>Số tiền:</Text>
                    <Text className="amount-text"> {planDetails.price.toLocaleString()} VND</Text>
                  </div>
                </>
              )}
            </div>
            <Divider />
            <div className="benefits-section">
              <Title level={4} style={{ color: '#52c41a', marginBottom: 16 }}>
                {isAgentProfilePayment ? '🎉 Chuyên trang môi giới đã được tạo!' : '🎉 Tài khoản đã được nâng cấp!'}
              </Title>
              <div className="benefits-list">
                {isAgentProfilePayment ? (
                  <>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Chuyên trang môi giới đã được tạo thành công</Text>
                    </div>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Hồ sơ đã được kích hoạt và hiển thị công khai</Text>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Đăng bài không giới hạn</Text>
                    </div>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Ưu tiên hiển thị trong tìm kiếm</Text>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="action-buttons">
              {isAgentProfilePayment ? (
                <Button type="primary" size="large" icon={<UserOutlined />} onClick={handleGoToAgentProfile}>
                  Xem chuyên trang
                </Button>
              ) : (
                <Button type="primary" size="large" icon={<UserOutlined />} onClick={handleGoToProfile}>
                  Xem tài khoản
                </Button>
              )}
              <Button size="large" icon={<HomeOutlined />} onClick={handleGoHome}>
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Payment failed
  return (
    <div className="payment-callback-container">
      <div className="error-section">
        <Card className="result-card error-card">
          <div className="error-icon">
            <CloseCircleOutlined />
          </div>
          <Title level={2} className="error-title">
            Thanh toán thất bại
          </Title>
          <div className="error-details">
            <div className="detail-item">
              <Text strong>Mã lỗi:</Text>
              <Text type="danger" code> {result?.vnPayResponseCode || result?.resultCode || 'Unknown'}</Text>
            </div>
          </div>
          <Divider />
          <div className="action-buttons">
            <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={handleRetry}>
              Thử lại
            </Button>
            <Button size="large" icon={<HomeOutlined />} onClick={handleGoHome}>
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallbackVnpay;
