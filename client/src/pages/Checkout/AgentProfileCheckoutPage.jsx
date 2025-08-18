import React, { useState, useEffect } from 'react';
import styles from './AgentProfileCheckoutPage.module.css';
import { Button, Card, Typography, message, Divider, Tag, Space, Row, Col } from 'antd';
import { CreditCardOutlined, BankOutlined, WalletOutlined, SafetyOutlined, UserOutlined, HomeOutlined, StarOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const { Text, Title } = Typography;

const AgentProfileCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const previewId = searchParams.get('previewId') || '';
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [loading, setLoading] = useState(false);

  const userId = user?.id || 0;

  // Agent Profile specific plans
  const agentPlans = [
    {
      key: 'basic',
      name: 'Gói Cơ Bản',
      price: 500000,
      originalPrice: 800000,
      discount: '38%',
      features: [
        'Chuyên trang môi giới chuyên nghiệp',
        'Hiển thị thông tin đầy đủ',
        'Tích hợp với hệ thống tìm kiếm',
        'Hỗ trợ cơ bản'
      ],
      duration: 'Vĩnh viễn'
    },
    {
      key: 'premium',
      name: 'Gói Cao Cấp',
      price: 1000000,
      originalPrice: 1500000,
      discount: '33%',
      features: [
        'Tất cả tính năng gói cơ bản',
        'Ưu tiên hiển thị trong tìm kiếm',
        'Thống kê chi tiết',
        'Hỗ trợ ưu tiên 24/7',
        'Tùy chỉnh giao diện nâng cao'
      ],
      duration: 'Vĩnh viễn'
    }
  ];

  const currentPlan = agentPlans.find(p => p.key === selectedPlan) || agentPlans[0];

  // Payment methods
  const paymentMethods = [
    {
      id: 'vnpay',
      name: 'VNPAY',
      description: 'Thanh toán online an toàn',
      icon: <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPAY" style={{ width: '24px', height: '24px' }} />,
      popular: true
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản trực tiếp',
      icon: <BankOutlined />,
      popular: false
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      description: 'Thanh toán qua ví điện tử',
      icon: <img src="https://developers.momo.vn/v3/img/logo.svg" alt="MoMo" style={{ width: '24px', height: '24px' }} />,
      popular: false
    }
  ];

  const [selectedMethod, setSelectedMethod] = useState('vnpay');

  useEffect(() => {
    if (!user) {
      message.error('Vui lòng đăng nhập trước khi thanh toán');
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePayment = async () => {
    if (!userId) {
      message.error('Vui lòng đăng nhập trước khi thanh toán');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      if (selectedMethod === 'vnpay') {
        const payload = {
          name: user?.name || "User",
          orderDescription: `userId=${userId};plan=${currentPlan.key};previewId=${previewId || ""};type=agent_profile`,
          amount: currentPlan.price,
          orderType: 'agent_profile',
          userId: userId,
          previewId: previewId || null,
        };
        
        const res = await axiosPrivate.post('/api/payment/vnpay/create', payload);
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          message.error('Không tạo được liên kết thanh toán');
        }
      } else if (selectedMethod === 'momo') {
        const payload = {
          name: user?.name || "User",
          orderDescription: `userId=${userId};plan=${currentPlan.key};previewId=${previewId || ""};type=agent_profile`,
          amount: currentPlan.price,
          orderType: 'agent_profile',
          userId: userId,
          previewId: previewId || null,
        };
        
        const res = await axiosPrivate.post('/api/payment/momo/create', payload);
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          message.error('Không tạo được liên kết thanh toán MoMo');
        }
      } else {
        message.info('Tính năng này sẽ được cập nhật sớm');
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutHeader}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          Tạo Chuyên Trang Môi Giới
        </Title>
        <Text style={{ color: '#ffd580', fontSize: '16px' }}>
          Xây dựng chuyên trang môi giới chuyên nghiệp để thu hút khách hàng
        </Text>
      </div>

      <div className={styles.checkoutContent}>
        <div className={styles.leftSection}>
          <Card className={styles.planCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Chọn Gói Dịch Vụ
            </Title>
            <div className={styles.planOptions}>
              {agentPlans.map((plan) => (
                <div
                  key={plan.key}
                  className={`${styles.planOption} ${selectedPlan === plan.key ? styles.planSelected : ''}`}
                  onClick={() => setSelectedPlan(plan.key)}
                >
                  <div className={styles.planHeader}>
                    <div className={styles.planName}>{plan.name}</div>
                    {plan.discount && (
                      <Tag color="orange" className={styles.discountTag}>
                        -{plan.discount}
                      </Tag>
                    )}
                  </div>
                  
                  <div className={styles.planPrice}>
                    <span className={styles.currentPrice}>{plan.price.toLocaleString()} VND</span>
                    {plan.originalPrice && (
                      <span className={styles.originalPrice}>{plan.originalPrice.toLocaleString()} VND</span>
                    )}
                  </div>
                  
                  <div className={styles.planDuration}>
                    <Text style={{ color: '#ffd580', fontSize: '14px' }}>
                      {plan.duration}
                    </Text>
                  </div>
                  
                  <div className={styles.planFeatures}>
                    {plan.features.map((feature, index) => (
                      <div key={index} className={styles.featureItem}>
                        <StarOutlined style={{ color: '#ff9800', marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontSize: '14px' }}>{feature}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {previewId && (
            <Card className={styles.previewCard}>
              <div className={styles.previewInfo}>
                <SafetyOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                <div>
                  <Text strong style={{ color: '#fff' }}>
                    Bản Xem Trước Hồ Sơ Môi Giới
                  </Text>
                  <div style={{ color: '#ffd580', fontSize: '14px' }}>
                    ID: {previewId}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className={styles.benefitsCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Lợi Ích Khi Có Chuyên Trang
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <UserOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Tăng Uy Tín</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Chuyên nghiệp hơn</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <HomeOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Hiển Thị Tốt Hơn</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Trong tìm kiếm</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <StarOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Tính Năng Nâng Cao</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Thống kê chi tiết</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <SafetyOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Hỗ Trợ Tốt</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>24/7</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        <div className={styles.rightSection}>
          <Card className={styles.summaryCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Tóm Tắt Thanh Toán
            </Title>
            <div className={styles.summaryRow}>
              <Text style={{ color: '#ccc' }}>Gói dịch vụ:</Text>
              <Text style={{ color: '#fff' }}>{currentPlan.name}</Text>
            </div>
            <div className={styles.summaryRow}>
              <Text style={{ color: '#ccc' }}>Thời hạn:</Text>
              <Text style={{ color: '#fff' }}>{currentPlan.duration}</Text>
            </div>
            <div className={styles.summaryRow}>
              <Text style={{ color: '#ccc' }}>Số tính năng:</Text>
              <Text style={{ color: '#fff' }}>{currentPlan.features.length} tính năng</Text>
            </div>
            <Divider style={{ background: '#333', margin: '12px 0' }} />
            <div className={styles.summaryRow}>
              <Text strong style={{ color: '#fff', fontSize: '16px' }}>Tổng tiền:</Text>
              <Title level={3} style={{ margin: 0, color: '#ff9800' }}>
                {currentPlan.price.toLocaleString()} VND
              </Title>
            </div>
            {currentPlan.originalPrice && (
              <div className={styles.summaryRow}>
                <Text style={{ color: '#999', fontSize: '12px' }}>Tiết kiệm:</Text>
                <Text style={{ color: '#52c41a', fontSize: '12px' }}>
                  {(currentPlan.originalPrice - currentPlan.price).toLocaleString()} VND
                </Text>
              </div>
            )}
          </Card>

          <Card className={styles.methodCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff' }}>
              Phương Thức Thanh Toán
            </Title>
            <div className={styles.methodOptions}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`${styles.methodOption} ${selectedMethod === method.id ? styles.methodSelected : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className={styles.methodIcon}>
                    {method.icon}
                  </div>
                  <div className={styles.methodInfo}>
                    <div className={styles.methodName}>
                      {method.name}
                      {method.popular && <Tag color="blue" size="small">Phổ biến</Tag>}
                    </div>
                    <div className={styles.methodDesc}>{method.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handlePayment}
              className={styles.payButton}
              icon={<CreditCardOutlined />}
            >
              Tạo Chuyên Trang Ngay
            </Button>

            
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileCheckoutPage;
