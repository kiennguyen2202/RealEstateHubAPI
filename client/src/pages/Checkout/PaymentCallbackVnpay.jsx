import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Typography, Card, Space, Divider, message } from 'antd';
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

  // Detect payment method from URL
  const isMoMoPayment = window.location.search.includes('resultCode') || 
                        window.location.search.includes('orderId') ||
                        window.location.search.includes('amount');

  useEffect(() => {
    const validatePayment = async () => {
      try {
        let response;
        if (isMoMoPayment) {
          // MoMo callback
          response = await axiosPrivate.get(`/api/payment/momo-return${window.location.search}`);
        } else {
          // VNPAY callback
          response = await axiosPrivate.get(`/api/payment/vnpay-return${window.location.search}`);
        }
        
        setResult(response.data);
        
        // If payment is successful, refresh user context to get updated role
        if (response.data?.success || response.data?.OrderInfo || response.data?.Success || 
            (response.data?.resultCode === "0")) {
          try {
            if (typeof refreshUser === 'function') {
              await refreshUser();
              message.success('Thanh toán thành công!');
            } else {
              console.warn('refreshUser is not a function:', refreshUser);
            }
          } catch (error) {
            console.error('Error refreshing user:', error);
          }
        }

        // Capture agentProfileId from response if present
        if (response.data?.agentProfileId) {
          setAgentProfileId(response.data.agentProfileId);
        }
      } catch (error) {
        console.error('Payment validation error:', error);
        setResult({ success: false, error: 'Lỗi xác thực thanh toán' });
      } finally {
        setLoading(false);
      }
    };

    validatePayment();
  }, [searchParams, isMoMoPayment]);

  
  const hasTypeMembership = result?.orderInfo?.includes('type=membership');
  const hasTypeAgent = result?.orderInfo?.includes('type=agent_profile');
  const hasPreviewId = result?.orderInfo?.includes('previewId=');
  const hasAgentProfileId = !!(result?.agentProfileId);
  
  
  const isAgentProfilePayment = hasTypeAgent || hasPreviewId || (hasAgentProfileId && !hasTypeMembership);

  

  // Extract plan and amount from orderInfo for better display
  const extractPlanInfo = (orderInfo) => {
    if (!orderInfo) return { plan: null, amount: null };
    
    const planMatch = orderInfo.match(/plan=([^;]+)/);
    const amountMatch = orderInfo.match(/(\d+)$/);
    
    return {
      plan: planMatch ? planMatch[1] : null,
      amount: amountMatch ? amountMatch[1] : null
    };
  };

  const { plan, amount: extractedAmount } = extractPlanInfo(result?.orderInfo);
  
  // Get plan details for display
  const getPlanDetails = (planKey, isAgent = false) => {
    if (isAgent) {
      const agentPlans = [
        { key: 'basic', name: 'Gói Cơ Bản', price: 500000 },
        { key: 'premium', name: 'Gói Cao Cấp', price: 1000000 }
      ];
      return agentPlans.find(p => p.key === planKey);
    } else {
      const membershipPlans = [
        { key: 'pro_month', name: 'Pro 1 Tháng', price: 199000 },
        { key: 'pro_quarter', name: 'Pro 3 Tháng', price: 549000 },
        { key: 'pro_year', name: 'Pro 12 Tháng', price: 1990000 }
      ];
      return membershipPlans.find(p => p.key === planKey);
    }
  };

  const planDetails = getPlanDetails(plan, isAgentProfilePayment);
  const displayAmount = planDetails?.price || result?.amount || extractedAmount;

  // Fallback: if VNPay response doesn't include agentProfileId, fetch by userId
  useEffect(() => {
    const fetchAgentProfileByUser = async () => {
      if (result?.success && isAgentProfilePayment && !agentProfileId && user?.id) {
        try {
          const res = await axiosPrivate.get(`/api/agent-profile/by-user/${user.id}`);
          if (res?.data?.id) {
            setAgentProfileId(res.data.id);
          }
        } catch (err) {
          console.warn('Không thể lấy AgentProfile theo userId:', err?.response?.data || err.message);
        }
      }
    };
    fetchAgentProfileByUser();
  }, [result, isAgentProfilePayment, agentProfileId, user]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoToAgentProfile = () => {
    // Navigate to the agent profile page using the actual ID from the response or fallback
    if (agentProfileId) {
      navigate(`/agent-profile/${agentProfileId}`);
    } else {
      navigate('/agent-profile');
    }
  };

  const handleRetry = () => {
    if (isAgentProfilePayment) {
      navigate('/agent-checkout');
    } else {
      navigate('/membership-checkout');
    }
  };

  if (loading) {
    return (
      <div className="payment-callback-container">
        <div className="loading-section">
          <div className="loading-card">
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1677ff' }} spin />} />
            <Title level={4} style={{ marginTop: 24, marginBottom: 8, color: '#1677ff' }}>
              Đang xác thực thanh toán...
            </Title>
            <Text type="secondary">Vui lòng chờ trong giây lát</Text>
          </div>
        </div>
      </div>
    );
  }

  // Check if payment is actually successful
  let isPaymentSuccessful = false;
  
  if (isMoMoPayment) {
    // MoMo payment success check
    isPaymentSuccessful = result?.resultCode === "0";
  } else {
    // VNPAY payment success check - must have success=true AND valid response code
    const vnPayResponseCode = result?.vnPayResponseCode;
    isPaymentSuccessful = result?.success === true && vnPayResponseCode === "00"; // VNPAY success code is "00"
  }

  if (isPaymentSuccessful) {
    // Auto navigate to profile after short delay
    
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
                <Text> {window.location.search.includes('resultCode') ? 'Ví MoMo' : 'VNPAY'}</Text>
              </div>
              {displayAmount && (
                <div className="detail-item">
                  <Text strong>Số tiền:</Text>
                  <Text className="amount-text"> {parseInt(displayAmount).toLocaleString()} VND</Text>
                </div>
              )}
              {planDetails && (
                <div className="detail-item">
                  <Text strong>Gói dịch vụ:</Text>
                  <Text> {planDetails.name}</Text>
                </div>
              )}
              {result.transactionId && (
                <div className="detail-item">
                  <Text strong>Mã giao dịch:</Text>
                  <Text code> {result.transactionId}</Text>
                </div>
              )}
              {result.orderId && (
                <div className="detail-item">
                  <Text strong>Mã đơn hàng:</Text>
                  <Text code> {result.orderId}</Text>
                </div>
              )}
            </div>
            <Divider />
            <div className="benefits-section">
              <Title level={4} style={{ color: '#52c41a', marginBottom: 16 }}>
                {isAgentProfilePayment ? '🎉 Chuyên trang môi giới đã được tạo thành công!' : '🎉 Tài khoản của bạn đã được nâng cấp!'}
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
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Tích hợp với hệ thống tìm kiếm</Text>
                    </div>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Bắt đầu nhận khách hàng tiềm năng</Text>
                    </div>
                    
                  </>
                ) : (
                  <>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Nâng cấp lên tài khoản Membership</Text>
                    </div>
                    <div className="benefit-item">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>Đăng bài 100 tin/tháng</Text>
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
                <>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<UserOutlined />}
                  onClick={handleGoToAgentProfile}
                  className="primary-button"
                >
                  Xem chuyên trang
                </Button>
                <Button 
                size="large" 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="secondary-button"
              >
                Về trang chủ
              </Button>
              </>
              ) : (
                <>
              <Button 
                type="primary" 
                size="large" 
                icon={<UserOutlined />}
                onClick={handleGoToProfile}
                className="primary-button"
              >
                Xem tài khoản
              </Button>
              <Button 
                size="large" 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="secondary-button"
              >
                Về trang chủ
              </Button>
              </>
            )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Check if this is a MoMo payment failure
  // More detailed MoMo detection
  const hasResultCode = window.location.search.includes('resultCode');
  const hasOrderId = window.location.search.includes('orderId');
  const hasAmount = window.location.search.includes('amount');
  const hasVnPayParams = window.location.search.includes('vnp_') || window.location.search.includes('vnpTxnRef');
  
  console.log('Payment method detection:', {
    search: window.location.search,
    isMoMoPayment,
    hasResultCode,
    hasOrderId,
    hasAmount,
    hasVnPayParams,
    result: result
  });
  
  // Improved MoMo failure detection
  const isMoMoFailure = (hasResultCode || hasOrderId || hasAmount) && 
                        !hasVnPayParams && 
                        (result?.Success === false || result?.resultCode !== "0");
  
  // VNPAY failure detection - improved logic
  const isVnPayFailure = hasVnPayParams && 
                         !hasResultCode && 
                         !hasOrderId && 
                         !hasAmount && 
                         (result?.success === false || 
                          (result?.vnPayResponseCode && result.vnPayResponseCode !== "00") ||
                          !result?.success);
  
  console.log('Failure detection:', {
    isMoMoFailure,
    isVnPayFailure,
    hasVnPayParams,
    hasResultCode,
    hasOrderId,
    hasAmount,
    resultSuccess: result?.success,
    vnPayResponseCode: result?.vnPayResponseCode
  });
  
  // If MoMo payment failed, show MoMo specific error
  if (isMoMoFailure) {
    console.log('MoMo payment failed detected:', {
      isMoMoPayment,
      resultCode: result?.resultCode,
      Success: result?.Success,
      isMoMoFailure
    });
    
    return (
      <div className="payment-callback-container">
        <div className="error-section">
          <Card className="result-card error-card">
            <div className="error-icon">
              <CloseCircleOutlined />
            </div>
            <Title level={2} className="error-title">
              Thanh toán MoMo thất bại
            </Title>
            <div className="error-details">
              <div className="detail-item">
                <Text strong>Phương thức:</Text>
                <Text> Ví MoMo</Text>
              </div>
              <div className="detail-item">
                <Text strong>Mã lỗi:</Text>
                <Text type="danger" code> {result?.resultCode || 'Unknown'}</Text>
              </div>
              {result?.message && (
                <div className="detail-item">
                  <Text strong>Thông báo:</Text>
                  <Text type="danger"> {result.message}</Text>
                </div>
              )}
              {result?.orderId && (
                <div className="detail-item">
                  <Text strong>Mã đơn hàng:</Text>
                  <Text code> {result.orderId}</Text>
                </div>
              )}
              {result?.amount && (
                <div className="detail-item">
                  <Text strong>Số tiền:</Text>
                  <Text> {parseInt(result.amount).toLocaleString()} VND</Text>
                </div>
              )}
            </div>
            <Divider />
            <div className="help-section">
              <Title level={4} style={{ color: '#ff4d4f', marginBottom: 16 }}>
                Nguyên nhân có thể:
              </Title>
              <div className="help-list">
                <div className="help-item">
                  <Text>• Số dư ví MoMo không đủ</Text>
                </div>
                <div className="help-item">
                  <Text>• Thông tin xác thực không chính xác</Text>
                </div>
                <div className="help-item">
                  <Text>• Giao dịch bị hủy bởi người dùng</Text>
                </div>
                <div className="help-item">
                  <Text>• Lỗi kết nối mạng</Text>
                </div>
                <div className="help-item">
                  <Text>• Giao dịch bị từ chối bởi MoMo</Text>
                </div>
              </div>
            </div>
            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                className="primary-button"
              >
                Thử lại
              </Button>
              <Button 
                size="large" 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="secondary-button"
              >
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If not MoMo failure, check for VNPAY failure
  if (isVnPayFailure) {
    console.log('VNPAY payment failed detected:', {
      hasVnPayParams,
      hasResultCode,
      hasOrderId,
      hasAmount,
      success: result?.success,
      isVnPayFailure
    });
    
    return (
      <div className="payment-callback-container">
        <div className="error-section">
          <Card className="result-card error-card">
            <div className="error-icon">
              <CloseCircleOutlined />
            </div>
            <Title level={2} className="error-title">
              Thanh toán VNPAY thất bại
            </Title>
            <div className="error-details">
              <div className="detail-item">
                <Text strong>Phương thức:</Text>
                <Text> VNPAY</Text>
              </div>
              <div className="detail-item">
                <Text strong>Mã lỗi:</Text>
                <Text type="danger" code> {result?.vnPayResponseCode || 'Unknown'}</Text>
              </div>
              {result?.error && (
                <div className="detail-item">
                  <Text strong>Lỗi:</Text>
                  <Text type="danger"> {result.error}</Text>
                </div>
              )}
              {result?.message && (
                <div className="detail-item">
                  <Text strong>Thông báo:</Text>
                  <Text> {result.message}</Text>
                </div>
              )}
              {result?.transactionId && (
                <div className="detail-item">
                  <Text strong>Mã giao dịch:</Text>
                  <Text code> {result.transactionId}</Text>
                </div>
              )}
              {result?.orderId && (
                <div className="detail-item">
                  <Text strong>Mã đơn hàng:</Text>
                  <Text code> {result.orderId}</Text>
                </div>
              )}
            </div>
            <Divider />
            <div className="help-section">
              <Title level={4} style={{ color: '#ff4d4f', marginBottom: 16 }}>
                Nguyên nhân có thể:
              </Title>
              <div className="help-list">
                <div className="help-item">
                  <Text>• Thông tin thẻ không chính xác</Text>
                </div>
                <div className="help-item">
                  <Text>• Số dư tài khoản không đủ</Text>
                </div>
                <div className="help-item">
                  <Text>• Giao dịch bị từ chối bởi ngân hàng</Text>
                </div>
                <div className="help-item">
                  <Text>• Lỗi kết nối mạng</Text>
                </div>
              </div>
            </div>
            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                className="primary-button"
              >
                Thử lại
              </Button>
              <Button 
                size="large" 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="secondary-button"
              >
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If we reach here, show a simple error message
  return (
    <div className="payment-callback-container">
      <div className="error-section">
        <Card className="result-card error-card">
          <div className="error-icon">
            <CloseCircleOutlined />
          </div>
          <Title level={2} className="error-title">
            Có lỗi xảy ra
          </Title>
          <div className="error-details">
            <div className="detail-item">
              <Text strong>Thông báo:</Text>
              <Text type="danger"> Vui lòng thử lại hoặc liên hệ hỗ trợ</Text>
            </div>
          </div>
          <Divider />
          <div className="action-buttons">
            <Button 
              type="primary" 
              size="large" 
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              className="primary-button"
            >
              Thử lại
            </Button>
            <Button 
              size="large" 
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              className="secondary-button"
            >
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallbackVnpay;
