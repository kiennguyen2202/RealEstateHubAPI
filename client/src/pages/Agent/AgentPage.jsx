import React from "react";
import { Typography, Button, Row, Col, Card, Collapse, Avatar, Statistic, Rate } from "antd";
import {
  UsergroupAddOutlined,
  TrophyTwoTone,
  EyeTwoTone,
  FormOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import styles from "./AgentPage.module.css";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const testimonials = [
  {
    name: "Nguyễn Văn An",
    company: "Môi giới tự do",
    comment:
      "Từ khi tham gia RealEstateHub, lượng khách hàng của tôi đã tăng gấp ba. Giao diện quản lý tin đăng rất thông minh và tiết kiệm thời gian.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    deals: 127,
  },
  {
    name: "Trần Thị Bích",
    company: "Công ty BĐS An Cư",
    comment:
      "Trang cá nhân chuyên nghiệp giúp tôi xây dựng được thương hiệu uy tín. Khách hàng tin tưởng hơn hẳn khi xem hồ sơ của tôi trên này.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    deals: 89,
  },
  {
    name: "Lê Văn Cường",
    company: "Môi giới cao cấp",
    comment:
      "RealEstateHub giúp tôi tiếp cận khách hàng chất lượng cao. Công cụ quản lý tin đăng rất hiệu quả và dễ sử dụng.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    deals: 203,
  },
];

const faqItems = [
  {
    key: "1",
    label: "Làm thế nào để đăng ký trở thành đối tác môi giới?",
    content:
      "Bạn chỉ cần nhấn vào nút 'Đăng ký ngay', chọn gói thành viên phù hợp và điền đầy đủ thông tin. Đội ngũ của chúng tôi sẽ liên hệ để xác thực và kích hoạt tài khoản của bạn.",
  },
  {
    key: "2",
    label: "Chi phí để tham gia là bao nhiêu?",
    content:
      "Chúng tôi có nhiều gói thành viên với các mức giá và quyền lợi khác nhau để phù hợp với nhu cầu của bạn. Vui lòng xem chi tiết tại trang đăng ký thành viên.",
  },
  {
    key: "3",
    label: "Tin đăng của tôi có được ưu tiên hiển thị không?",
    content:
      "Có. Tất cả các đối tác môi giới đều được hưởng quyền lợi ưu tiên hiển thị tin đăng, giúp bạn tiếp cận khách hàng mục tiêu một cách nhanh chóng và hiệu quả nhất.",
  },
  {
    key: "4",
    label: "Tôi có thể quản lý nhiều tin đăng cùng lúc không?",
    content:
      "Hoàn toàn có thể! Hệ thống của chúng tôi cho phép bạn quản lý không giới hạn số lượng tin đăng với các công cụ phân loại và tìm kiếm thông minh.",
  },
];

const AgentPage = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://s3-cdn.rever.vn/p/v2.48.49/images/bg-agent.jpg')`,
        }}
      >
        <div className={styles.heroContent}>
          <Title className={styles.heroTitle}>
            Nền Tảng Chuyên Nghiệp Dành Riêng Cho Môi Giới Bất Động Sản
          </Title>
          <Paragraph className={styles.heroSubtitle}>
            Nâng tầm thương hiệu, bứt phá doanh thu và kết nối với hàng triệu
            khách hàng tiềm năng trên RealEstateHub.
          </Paragraph>
          <div className={styles.heroStats}>
            <Row gutter={[32, 16]} justify="center">
              <Col>
                <Statistic title="Môi giới đã tham gia" value={2847} suffix="+" />
              </Col>
              <Col>
                <Statistic title="Giao dịch thành công" value={15632} suffix="+" />
              </Col>
              <Col>
                <Statistic title="Khách hàng hài lòng" value={98} suffix="%" />
              </Col>
            </Row>
          </div>
          <Link to="/agent-profile/preview">
            <Button type="primary" size="large" className={styles.heroButton}>
              <UserAddOutlined /> Đăng ký ngay
            </Button>
          </Link>
        </div>
      </div>

      {/* Benefits Section */}
      <div className={styles.section}>
        <Title level={2} className={styles.sectionTitle}>
          Đặc Quyền Dành Cho Đối Tác Môi Giới
        </Title>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Card hoverable className={styles.benefitCard}>
              <div className={styles.benefitIconWrapper}>
                <UsergroupAddOutlined className={styles.benefitIcon} />
              </div>
              <Title level={3}>Xây dựng niềm tin với khách hàng</Title>
              <Paragraph>
                Chuyên trang cá nhân hóa dành cho môi giới chuyên nghiệp, giúp bạn quảng bá uy tín, kinh nghiệm và giỏ hàng của mình tới khách hàng
              </Paragraph>
              <div className={styles.benefitImage}>
                <img 
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop" 
                  alt="Professional Profile"
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card hoverable className={styles.benefitCard}>
              <div className={styles.benefitIconWrapper}>
                <TrophyTwoTone twoToneColor="#fadb14" className={styles.benefitIcon} />
              </div>
              <Title level={3}>Hiển thị giỏ hàng số lượng lớn</Title>
              <Paragraph>
                Giới thiệu các bất động sản nổi bật của bạn, với giỏ hàng được sắp xếp trực quan theo khu vực và loại hình
              </Paragraph>
              <div className={styles.benefitImage}>
                <img 
                  src="https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                  alt="Property Portfolio"
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card hoverable className={styles.benefitCard}>
              <div className={styles.benefitIconWrapper}>
                <EyeTwoTone twoToneColor="#52c41a" className={styles.benefitIcon} />
              </div>
              <Title level={3}>Đa dạng phễu thu hút khách hàng</Title>
              <Paragraph>
                Ngoài tin đăng của chính mình, khách hàng có thể tìm thấy bạn thông qua nhiều điểm chạm hơn, đặc biệt từ trang chủ của RealEstateHub
              </Paragraph>
              <div className={styles.benefitImage}>
                <img 
                  src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=250&fit=crop" 
                  alt="Customer Acquisition"
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Steps Section */}
      <div className={`${styles.section} ${styles.stepsSection}`}>
        <Title level={2} className={styles.sectionTitle}>
          Tạo chuyên trang dễ dàng chỉ với 3 bước
        </Title>
        <Row gutter={[32, 48]} justify="center" align="middle">
          <Col xs={24} md={6} className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <UserAddOutlined className={styles.stepIcon} />
            </div>
            <Title level={4}>1. Đăng ký</Title>
            <Paragraph>
              Nhấn "Tạo chuyên trang ngay" trong mục tài khoản.
            </Paragraph>
          </Col>
          <Col xs={24} md={6} className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <FormOutlined className={styles.stepIcon} />
            </div>
            <Title level={4}>2. Điền thông tin</Title>
            <Paragraph>
              Cung cấp thông tin cá nhân, kinh nghiệm và giỏ hàng của bạn.
            </Paragraph>
          </Col>
          <Col xs={24} md={6} className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <CheckCircleOutlined className={styles.stepIcon} />
            </div>
            <Title level={4}>3. Thanh toán</Title>
            <Paragraph>
              Nhấn "Lưu và thanh toán" để kích hoạt chuyên trang của bạn.
            </Paragraph>
          </Col>
        </Row>
      </div>

      {/* Testimonials Section */}
      <div className={styles.section}>
        <Title level={2} className={styles.sectionTitle}>
          <MessageOutlined style={{ marginRight: 10 }} />
          Đối Tác Nói Về Chúng Tôi
        </Title>
        <Row gutter={[32, 32]} justify="center">
          {testimonials.map((testimonial, index) => (
            <Col key={index} xs={24} md={8}>
              <Card className={styles.testimonialCard}>
                <div className={styles.testimonialHeader}>
                  <Avatar
                    size={64}
                    src={testimonial.avatar}
                    className={styles.testimonialAvatar}
                  />
                  <div className={styles.testimonialInfo}>
                    <Title level={5} style={{ marginBottom: 4 }}>
                      {testimonial.name}
                    </Title>
                    <Text type="secondary">{testimonial.company}</Text>
                    <div className={styles.testimonialStats}>
                      <Rate disabled defaultValue={testimonial.rating} style={{ fontSize: 12 }} />
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {testimonial.deals} giao dịch
                      </Text>
                    </div>
                  </div>
                </div>
                <Paragraph className={styles.testimonialComment}>
                  "{testimonial.comment}"
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* FAQ Section */}
      <div className={`${styles.section} ${styles.faqSection}`}>
        <Title level={2} className={styles.sectionTitle}>
          <QuestionCircleOutlined style={{ marginRight: 10 }} />
          Câu Hỏi Thường Gặp
        </Title>
        <Collapse accordion className={styles.faqCollapse}>
          {faqItems.map((item) => (
            <Panel header={item.label} key={item.key}>
              <Paragraph>{item.content}</Paragraph>
            </Panel>
          ))}
        </Collapse>
      </div>

      {/* Final CTA Section */}
      <div className={`${styles.section} ${styles.finalCtaSection}`}>
        <div className={styles.ctaContent}>
          <Title level={2}>Bạn Đã Sẵn Sàng Chinh Phục Thị Trường?</Title>
          <Paragraph style={{ fontSize: "1.1rem", marginBottom: 32 }}>
            Đừng bỏ lỡ cơ hội kết nối với hàng ngàn khách hàng tiềm năng.
          </Paragraph>
          <Row gutter={[16, 16]} justify="center">
            <Col>
              <Link to="/agent-profile/preview">
                <Button type="primary" size="large" className={styles.heroButton}>
                  <UserAddOutlined /> Tham gia ngay hôm nay
                </Button>
              </Link>
            </Col>
            <Col>
              <Link to="/agent-profile">
                <Button size="large" className={styles.secondaryButton}>
                  <EyeOutlined /> Xem môi giới khác
                </Button>
              </Link>
            </Col>
          </Row>
        </div>
        <div className={styles.ctaImage}>
          <img 
            src="https://images.unsplash.com/photo-1599723331688-cc62e87a8100?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Join Now"
            style={{ width: '100%', height: 600, objectFit: 'cover', borderRadius: 12 }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
