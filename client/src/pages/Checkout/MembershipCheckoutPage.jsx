import React, { useMemo, useState, useEffect } from 'react';
import styles from './MembershipCheckoutPage.module.css';
import { Button, Card, Typography, message, Divider, Tag, Space, Row, Col } from 'antd';
import { CreditCardOutlined, BankOutlined, WalletOutlined, SafetyOutlined, UserOutlined, CrownOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';
import axiosPrivate from '../../api/axiosPrivate';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const { Text, Title } = Typography;

const MembershipCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('pro_month');
  const [loading, setLoading] = useState(false);

  const userId = user?.id || 0;

  // Membership plans with features
  const membershipPlans = [
    {
      key: 'pro_month',
      name: 'Pro 1 Tháng',
      price: 199000,
      originalPrice: 299000,
      discount: '33%',
      features: [
        'Đăng bài 100 tin/tháng',
        'Ưu tiên hiển thị trong tìm kiếm',
        'Hỗ trợ cơ bản',
        'Thống kê cơ bản'
      ],
      duration: '1 tháng'
    },
    {
      key: 'pro_quarter',
      name: 'Pro 3 Tháng',
      price: 549000,
      originalPrice: 897000,
      discount: '39%',
      features: [
        'Tất cả tính năng Pro 1 tháng',
        'Đăng bài 300 tin/3 tháng',
        'Hỗ trợ ưu tiên',
        'Thống kê chi tiết',
        'Báo cáo hàng tuần'
      ],
      duration: '3 tháng'
    },
    {
      key: 'pro_year',
      name: 'Pro 12 Tháng',
      price: 1990000,
      originalPrice: 3588000,
      discount: '45%',
      features: [
        'Tất cả tính năng Pro 3 tháng',
        'Đăng bài 1200 tin/năm',
        'Hỗ trợ 24/7',
        'Thống kê nâng cao',
        'Báo cáo hàng tháng',
        'Tùy chỉnh giao diện'
      ],
      duration: '12 tháng'
    }
  ];

  const currentPlan = useMemo(
    () => membershipPlans.find(p => p.key === selectedPlan) || membershipPlans[0],
    [selectedPlan]
  );

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
          orderDescription: `userId=${userId};plan=${currentPlan.key};type=membership`,
          amount: currentPlan.price,
          orderType: 'membership',
          userId: userId,
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
          orderDescription: `userId=${userId};plan=${currentPlan.key};type=membership`,
          amount: currentPlan.price,
          orderType: 'membership',
          userId: userId,
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
          Nâng Cấp Tài Khoản Membership
        </Title>
        <Text style={{ color: '#ffd580', fontSize: '16px' }}>
          Nâng cấp tài khoản để đăng bài không giới hạn và ưu tiên hiển thị
        </Text>
      </div>

      <div className={styles.checkoutContent}>
        <div className={styles.leftSection}>
          <Card className={styles.planCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Chọn Gói Dịch Vụ
            </Title>
            <div className={styles.planOptions}>
              {membershipPlans.map((plan) => (
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

          <Card className={styles.benefitsCard}>
            <Title level={4} style={{ marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Lợi Ích Khi Nâng Cấp Membership
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <CrownOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Tăng Uy Tín</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Tài khoản Pro</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <RocketOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Hiển Thị Tốt Hơn</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Ưu tiên tìm kiếm</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.benefitItem}>
                  <StarOutlined style={{ color: '#ff9800', fontSize: '24px' }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Đăng Bài Nhiều</Text>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>100 tin/tháng</div>
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
              Nâng Cấp Membership Ngay
            </Button>

            
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckoutPage;