import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosPrivate from '../../api/axiosPrivate';
import PropertyCard from '../../components/property/PropertyCard';
import { message, Row, Col, Empty, Typography, Tag, Skeleton, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import styles from './PostListPage.module.css';

const PostListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Lấy params từ URL
  const categoryType = searchParams.get('category') || '';
  const isSale = window.location.pathname.includes('/Sale');
  const isRent = window.location.pathname.includes('/Rent');

  useEffect(() => {
    fetchProperties();
    fetchCategories();
  }, [categoryType, isSale, isRent]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let url = '/api/posts';
      
      const params = new URLSearchParams();
      
      // Thêm filter cho transaction type
      if (isSale) {
        params.append('transactionType', 'Sale');
      } else if (isRent) {
        params.append('transactionType', 'Rent');
      }
      
      // Thêm filter cho category nếu có
      if (categoryType) {
        params.append('categoryType', getCategoryNameForAPI(categoryType));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axiosPrivate.get(url);
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      message.error('Không thể tải danh sách bất động sản');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosPrivate.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getPageTitle = () => {
    let title = '';
    
    if (isSale) {
      title = 'Mua Bán Bất Động Sản';
    } else if (isRent) {
      title = 'Cho Thuê Bất Động Sản';
    } else {
      title = 'Bất Động Sản';
    }

    if (categoryType) {
      const category = categories.find(cat => 
        cat.name.toLowerCase().includes(categoryType.toLowerCase()) ||
        categoryType.toLowerCase().includes(cat.name.toLowerCase())
      );
      if (category) {
        title += ` - ${category.name}`;
      }
    }

    return title;
  };

  const getPageDescription = () => {
    if (isSale) {
      return categoryType 
        ? `Tìm kiếm ${getCategoryName(categoryType)} mua bán phù hợp với nhu cầu của bạn`
        : 'Tìm kiếm bất động sản mua bán phù hợp với nhu cầu của bạn';
    } else if (isRent) {
      return categoryType 
        ? `Tìm kiếm ${getCategoryName(categoryType)} cho thuê với giá tốt nhất`
        : 'Tìm kiếm bất động sản cho thuê với giá tốt nhất';
    }
    return 'Khám phá các tin đăng bất động sản mới nhất';
  };

  const getCategoryName = (categoryType) => {
    const categoryMap = {
      'apartment': 'Căn hộ',
      'house': 'Nhà riêng',
      'office': 'Văn phòng',
      'shop': 'Cửa hàng',
      'land': 'Đất nền',
      'warehouse': 'Kho xưởng'
    };
    return categoryMap[categoryType] || categoryType;
  };

  const getCategoryNameForAPI = (categoryType) => {
    const categoryMap = {
      'apartment': 'Căn hộ',
      'house': 'Nhà riêng',
      'office': 'Văn phòng',
      'shop': 'Cửa hàng',
      'land': 'Đất nền',
      'warehouse': 'Kho xưởng'
    };
    return categoryMap[categoryType] || categoryType;
  };

  const handleSelectCategory = (name) => {
    if (!name) {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.delete('category');
        return p;
      });
      return;
    }
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('category', name);
      return p;
    });
  };

  const renderLoadingGrid = () => (
    <Row gutter={[24, 24]}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={idx}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonImage}>
              <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
            </div>
            <div className={styles.skeletonBody}>
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Hero */}
        <div className={styles.hero}>
          <Typography.Title level={2} className={styles.title}>
            {getPageTitle()}
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            {getPageDescription()}
          </Typography.Paragraph>

          {/* Category chips */}
          <div className={styles.chipsRow}>
            <Tag
              className={`${styles.chip} ${!categoryType ? styles.chipActive : ''}`}
              onClick={() => handleSelectCategory('')}
            >
              Tất cả
            </Tag>
            {categories.map(cat => (
              <Tag
                key={cat.id}
                className={`${styles.chip} ${categoryType && (cat.name.toLowerCase().includes(categoryType.toLowerCase()) || categoryType.toLowerCase().includes(cat.name.toLowerCase())) ? styles.chipActive : ''}`}
                onClick={() => handleSelectCategory(cat.name)}
              >
                {cat.name}
              </Tag>
            ))}
          </div>

          {categoryType && (
            <div className={styles.infoBox}>
              <Typography.Text className={styles.infoText}>
                Đang xem: <span className={styles.infoHighlight}>{getCategoryName(categoryType)}</span>
              </Typography.Text>
              <span className={styles.dot} />
              <Typography.Text type="secondary">{properties.length} tin đăng</Typography.Text>
            </div>
          )}
        </div>

        <Divider className={styles.divider} />

        {/* Content */}
        {loading ? (
          renderLoadingGrid()
        ) : properties.length > 0 ? (
          <Row gutter={[24, 24]}>
            {properties.map(property => (
              <Col xs={24} sm={12} lg={8} xl={6} key={property.id}>
                <PropertyCard property={property} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className={styles.emptyWrap}>
            <Empty
              image={<HomeOutlined style={{ fontSize: 48, color: '#c0c4cc' }} />}
              description="Không tìm thấy tin đăng nào"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostListPage;
