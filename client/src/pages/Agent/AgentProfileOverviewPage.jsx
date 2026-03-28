import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Button, Tag, Rate, Tabs, List, Spin, message, Row, Col, Divider } from 'antd';
import axiosPrivate from '../../api/axiosPrivate.js';
import axiosClient from '../../api/axiosClient.js';
import { UserOutlined } from '@ant-design/icons';
import { getCityById, getDistrictById, getCategoryById } from '../../services/agentProfileService.js';
import { useAuth } from '../../auth/AuthContext.jsx';

const { TabPane } = Tabs;

// Helper function to truncate arrays and add ellipsis
const truncateWithEllipsis = (arr, limit) => {
  if (!arr || arr.length === 0) return '---';
  if (arr.length <= limit) return arr.join(', ');
  return `${arr.slice(0, limit).join(', ')}...`;
};

const formatAreaCity = (item) => {
  if (!item) return '---';
  return item.cityName ? `${item.areaName} (${item.cityName})` : item.areaName;
};

const formatAreaDisplay = (areaList) => {
  if (!areaList || areaList.length === 0) return '---';
  return (
    <>
      {areaList.map((item, index) => (
        <div key={index}>{formatAreaCity(item)}</div>
      ))}
    </>
  );
};

export default function AgentProfileOverviewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState(null);
  const [areaNames, setAreaNames] = useState([]); 
  const [categoryNames, setCategoryNames] = useState([]);
  
  const [formattedTransactionCategories, setFormattedTransactionCategories] = useState([]);
  const [isPreview, setIsPreview] = useState(false);
  const featuredRef = useRef(null);
  const postsRef = useRef(null);
  const reviewsRef = useRef(null);
  
  const [activeTabKey, setActiveTabKey] = useState('featured');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true);
      const isPreviewMode = window.location.pathname.includes('/preview/');
      setIsPreview(isPreviewMode);

      // Nếu quay lại từ form và không đổi ảnh, cố gắng lấy previewId đã lưu
      let previewIdFromSession = null;
      if (isPreviewMode && user?.id) {
        previewIdFromSession = sessionStorage.getItem(`agentPreviewId_${user.id}`);
      }

      const endpoint = isPreviewMode 
        ? `/api/agent-profile/preview/${previewIdFromSession || id}`
        : `/api/agent-profile/${id}`;
        
      try {
        const res = await axiosPrivate.get(endpoint);
        const agentData = res.data;
        
        setAgent(agentData);
        console.log('Agent data loaded:', agentData);
        console.log('Avatar URL:', agentData.avatarUrl);
        console.log('Banner URL:', agentData.bannerUrl);
        console.log('Full agent data:', JSON.stringify(agentData, null, 2));

        if (agentData) {
          // Lưu server URLs để khi quay về trang đăng ký vẫn có ảnh
          if (isPreviewMode && user?.id) {
            try {
              if (agentData.avatarUrl) {
                sessionStorage.setItem(`agentServerAvatar_${user.id}`, agentData.avatarUrl);
              }
              if (agentData.bannerUrl) {
                sessionStorage.setItem(`agentServerBanner_${user.id}`, agentData.bannerUrl);
              }
            } catch (_) {}
          }
          // Tạo areaNames từ areaIds nếu backend không cung cấp
          if (agentData.areaIds?.length > 0 && !agentData.areaNames) {
            const fetchedAreaCityPairs = await Promise.all(
              agentData.areaIds.map(async (areaId) => {
                try {
                  const district = await getDistrictById(areaId);
                  if (district?.cityId) {
                    const city = await getCityById(district.cityId);
                    return `${district.name}, ${city?.name || 'Unknown City'}`;
                  }
                  return district?.name || null;
                } catch (err) {
                  console.log(`Failed to fetch area with ID ${areaId}:`, err);
                  return null;
                }
              })
            );
            const validAreaNames = fetchedAreaCityPairs.filter(name => name);
            // Cập nhật agentData với areaNames
            agentData.areaNames = validAreaNames;
           }

          // Fetch category names
          if (agentData.categoryIds?.length > 0) {
            const fetchedCategoryNames = await Promise.all(
              agentData.categoryIds.map(async (categoryId) => {
                try {
                  const category = await getCategoryById(categoryId);
                  console.log(`Category ${categoryId}:`, category);
                  return category?.name || null;
                } catch (err) {
                  console.error(`Failed to fetch category with ID ${categoryId}:`, err);
                  return null;
                }
              })
            );
            console.log('Fetched category names:', fetchedCategoryNames);
            setCategoryNames(fetchedCategoryNames.filter(name => name));
          }
        
          
        }
      } catch (err) {
        setError('Failed to load agent data.');
        message.error('Failed to load agent data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAgentData();
  }, [id]);

  const handleSaveAndPay = async () => {
    if (!isPreview) return;
    
    // Xóa session storage khi user thực sự thanh toán
    if (user?.id) {
      sessionStorage.removeItem(`agentForm_${user.id}`);
      sessionStorage.removeItem(`agentAvatar_${user.id}`);
      sessionStorage.removeItem(`agentBanner_${user.id}`);
      sessionStorage.removeItem(`agentAreas_${user.id}`);
    }
    
    navigate(`/agent-checkout?previewId=${id}`);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><Spin size="large" /></div>;
  }
  if (error) {
    return <Card style={{ maxWidth: 600, margin: '48px auto', textAlign: 'center' }}>{error}</Card>;
  }
  if (!agent) return null;

  const featuredPosts = [
    { id: 1, title: 'Bất động sản mẫu 1', price: '1 tỷ', img: 'http://localhost:5173/1000_F_509365220_oNhwwiKfwkIkY8mgkSIWRNnbzzs4H1P8.jpg', time: 'vài phút trước' },
    { id: 2, title: 'Bất động sản mẫu 2', price: '2 tỷ', img: 'http://localhost:5173/1000_F_650048974_qV9nvGZxunByUDb5QRTvgSn5E8Gpwa5V.jpg', time: 'vài phút trước' },
    { id: 3, title: 'Bất động sản mẫu 3', price: '3 tỷ', img: 'http://localhost:5173/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg', time: 'vài phút trước' },
  ];
  const agentPosts = [
    { id: 1, title: 'Hàng mẫu 1', price: '500.000.000 đ', img: 'http://localhost:5173/1000_F_509365220_oNhwwiKfwkIkY8mgkSIWRNnbzzs4H1P8.jpg', time: 'vài phút trước' },
    { id: 2, title: 'Hàng mẫu 2', price: '1 tỷ', img: 'http://localhost:5173/1000_F_650048974_qV9nvGZxunByUDb5QRTvgSn5E8Gpwa5V.jpg', time: 'vài phút trước' },
    { id: 3, title: 'Hàng mẫu 3', price: '2 tỷ', img: 'http://localhost:5173/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg', time: 'vài phút trước' },
    { id: 4, title: 'Hàng mẫu 4', price: '3.5 tỷ', img:'http://localhost:5173/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg', time: 'vài phút trước' },
    { id: 5, title: 'Hàng mẫu 5', price: '4 tỷ', img:'http://localhost:5173/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg', time: 'vài phút trước' },
    { id: 6, title: 'Hàng mẫu 6', price: '5 tỷ', img: 'http://localhost:5173/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg', time: 'vài phút trước' },
  ];
  const customerReviews = [
    {
      id: 1,
      buyer: 'Buyer 1',
      date: '29-07-2020',
      ratingText: 'Bất động sản chất lượng. Môi giới tư vấn tốt, thân thiện',
      tags: ['Sản phẩm chất lượng', 'Sản phẩm giá hời', 'Đúng hẹn']
    },
    {
      id: 2,
      buyer: 'Buyer 2',
      date: '2 tuần trước',
      ratingText: 'Sản phẩm chất lượng',
      tags: ['Sản phẩm chất lượng', 'Sản phẩm giá hời']
    },
  ];

  const handleTabChange = (key) => {
    setActiveTabKey(key); 
    
    // Logic cuộn đến phần tử tương ứng
    if (key === 'featured' && featuredRef.current) {
      featuredRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'posts' && postsRef.current) {
      postsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'reviews' && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Hàm xử lý gộp các district cùng city từ areaNames backend
  const processAreaNames = (areaNamesList) => {
    if (!areaNamesList || areaNamesList.length === 0) return [];
    
    // Parse "District, City" format và gộp theo city
    const cityGroups = {};
    areaNamesList.forEach(name => {
      const parts = name.split(', ');
      if (parts.length >= 2) {
        const district = parts[0];
        const city = parts.slice(1).join(', ');
        if (!cityGroups[city]) {
          cityGroups[city] = [];
        }
        cityGroups[city].push(district);
      }
    });
    
    // Tạo chuỗi "District1, District2 (City)"
    return Object.entries(cityGroups).map(([city, districts]) => {
      const uniqueDistricts = [...new Set(districts)];
      return `${uniqueDistricts.join(', ')} (${city})`;
    });
  };

  // Thêm hàm render khu vực hoạt động ưu tiên name
  const renderAreaNames = () => {
    // Ưu tiên sử dụng AreaNames từ backend nếu có
    if (agent && Array.isArray(agent.areaNames) && agent.areaNames.length > 0) {
      const processedAreas = processAreaNames(agent.areaNames);
      if (processedAreas.length > 0) {
        return (
          <>
            {processedAreas.map((areaName, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>{areaName}</div>
            ))}
          </>
        );
      }
    }
    // Fallback: sử dụng logic cũ
    if (agent && Array.isArray(agent.areas) && agent.areas.length > 0 && agent.areas[0].name) {
      return (
        <>
          {agent.areas.map((area, idx) => (
            <div key={area.id || idx} style={{ marginBottom: 4 }}>{area.name}{area.cityName ? ` (${area.cityName})` : ''}</div>
          ))}
        </>
      );
    }
    // Nếu không có, dùng logic fetch cũ
    return formatAreaDisplay(areaNames);
  };

  // Thêm hàm render loại hình môi giới mới
  const renderCategoryTransactionTypes = () => {
    // Nếu có TransactionTypes và CategoryIds từ backend
    if (agent && Array.isArray(agent.transactionTypes) && Array.isArray(agent.categoryIds) && agent.transactionTypes.length > 0) {
      return (
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {agent.transactionTypes.map((type, idx) => {
            let label = '';
            if (type === '0' || type === 0 || type === 'Mua bán' || type === 'Sale') {
              label = 'Mua bán';
            } else if (type === '1' || type === 1 || type === 'Cho thuê' || type === 'Rent') {
              label = 'Cho thuê';
            } else {
              label = type;
            }
            return (
              <li key={idx} style={{ marginBottom: 4 }}>
                <span>{label} - {categoryNames[idx] || 'Loại hình BĐS'}</span>
              </li>
            );
          })}
        </ul>
      );
    }
    // Fallback: logic cũ
    return (
      <div>
        {agent.transactionType === 0 ? 'Mua bán' : 'Cho thuê'} - {categoryNames[0] || '---'}
      </div>
    );
  };

  return (
    <div style={{ background: '#18191a', minHeight: '100vh', padding: 24 }}>
      {agent.bannerUrl && (
        <div style={{ width: '100%', marginBottom: 24 }}>
          <img
            src={agent.bannerUrl.startsWith('http') ? agent.bannerUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${agent.bannerUrl}`}
            alt="Banner"
            style={{
              width: '100%',
              maxHeight: 260,
              objectFit: 'cover',
              borderRadius: 12,
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
            }}
            onError={(e) => {
              console.log('Banner load error:', agent.bannerUrl);
              e.target.style.display = 'none';
            }}
            onLoad={() => {
              console.log('Banner loaded successfully:', agent.bannerUrl);
            }}
          />
        </div>
      )}
      <Row gutter={32}>
        <Col xs={24} md={7}>
          <Card style={{ background: '#232428', color: '#fff', marginBottom: 24 }} styles={{ body: { background: '#232428', color: '#fff' } }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar
                size={80}
                src={agent.avatarUrl ? (agent.avatarUrl.startsWith('http') ? agent.avatarUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${agent.avatarUrl}`) : null}
                icon={<UserOutlined />}
                style={{ marginBottom: 8 }}
                onError={(e) => {
                  console.log('Avatar load error:', agent.avatarUrl);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Avatar loaded successfully:', agent.avatarUrl);
                }}
              />
              <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>{agent.shopName}</div>
              <Rate disabled defaultValue={5} style={{ fontSize: 16, color: '#f59e42' }} />
              <span style={{ color: '#f59e42', marginLeft: 8 }}>(80 đánh giá)</span>
              <div style={{ margin: '8px 0', color: '#aaa' }}>Người theo dõi: 148 | Tin đăng: 88</div>
              {isPreview ? (
                <>
              <Button type="default" style={{ marginRight: 8 }} onClick={() => {
                // Lưu lại URL ảnh từ server để khi quay lại form không chọn ảnh mới vẫn giữ được
                if (isPreview && user?.id) {
                  try {
                    if (agent?.avatarUrl) {
                      sessionStorage.setItem(`agentServerAvatar_${user.id}`, agent.avatarUrl);
                    }
                    if (agent?.bannerUrl) {
                      sessionStorage.setItem(`agentServerBanner_${user.id}`, agent.bannerUrl);
                    }
                  } catch (_) {}
                }
                navigate(-1);
              }}>
                Trở về chỉnh sửa
              </Button>
              <Button type="primary" onClick={handleSaveAndPay}>
                Lưu & Thanh toán
              </Button>
                </>
              ) : (
                 <Tag color="green">Đã hoạt động</Tag>
              )}
            </div>
            <Divider style={{ background: '#333' }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>GIỚI THIỆU</div>
              <div>{agent.description}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>KHU VỰC HOẠT ĐỘNG</div>
              <div>
                {renderAreaNames()}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>ĐỊA CHỈ</div>
              <div>{agent.address}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>SỐ ĐIỆN THOẠI</div>
              <div>{agent.phoneNumber}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>LOẠI HÌNH MÔI GIỚI</div>
              <div>
                {renderCategoryTransactionTypes()}
              </div>
            </div>
            <Button type="link" style={{ color: '#40a9ff', padding: 0 }}>Xem thêm thông tin &gt;</Button>
          </Card>
        </Col>
        <Col xs={24} md={17}>
                    <Tabs
            activeKey={activeTabKey}
            onChange={handleTabChange}
            style={{ background: '#232428', color: '#fff', borderRadius: 8 }}
            tabBarStyle={{ color: '#fff' }}
            items={[
              { key: 'featured', label: 'NỔI BẬT' },
              { key: 'posts', label: 'TIN ĐĂNG' },
              { key: 'reviews', label: 'ĐÁNH GIÁ' }
            ]}
          />

          <div ref={featuredRef} style={{ background: '#232428', color: '#fff', padding: '16px 24px', borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0', color: '#fff' }}>Bất động sản nổi bật</div>
            <List
              grid={{ gutter: 16, column: featuredPosts.length }} 
              dataSource={featuredPosts}
              renderItem={item => (
                <List.Item>
                  <Card hoverable cover={<img src={item.img} alt={item.title} style={{ height: 120, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />} style={{ background: '#232428', color: '#fff' }}>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    <div style={{ color: '#ff4d4f', fontWeight: 600 }}>{item.price}</div>
                    <div style={{ color: '#aaa', fontSize: 12 }}>{item.time}</div>
                    <Button shape="circle" icon={<span style={{ color: '#fff' }}>&hearts;</span>} style={{ float: 'right', marginTop: -32, background: 'transparent', border: 'none' }} />
                  </Card>
                </List.Item>
              )}
            />
          </div>

          <div ref={postsRef} style={{ background: '#232428', color: '#fff', padding: '16px 24px', borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0', color: '#fff' }}>Tin đăng của môi giới</div>
            <List
              itemLayout="horizontal"
              dataSource={agentPosts}
              renderItem={item => (
                <List.Item style={{ background: '#232428', color: '#fff', borderBottom: '1px solid #333', alignItems: 'flex-start' }}>
                  <List.Item.Meta
                    avatar={
                      <img
                        src={item.img}
                        alt={item.title}
                        style={{
                          width: 110,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 8,
                          marginRight: 16,
                          background: '#222'
                        }}
                      />
                    }
                    title={<span style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>}
                    description={
                      <div>
                        <div style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>{item.price}</div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>{item.time}</div>
                        
                      </div>
                    }
                  />
                  <Button shape="circle" icon={<span style={{ color: '#fff' }}>&hearts;</span>} style={{ background: 'transparent', border: 'none' }} />
                </List.Item>
              )}
            />
          </div>

          <div ref={reviewsRef} style={{ background: '#232428', color: '#fff', padding: '16px 24px', borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0', color: '#fff' }}>Đánh giá từ khách hàng</div>
            <List
              itemLayout="vertical" 
              dataSource={customerReviews}
              renderItem={item => (
                <List.Item style={{ background: '#232428', color: '#fff', borderBottom: '1px solid #333', paddingBottom: 16, marginBottom: 16 }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={<span style={{ color: '#fff', fontWeight: 600 }}>{item.buyer}</span>}
                    description={<span style={{ color: '#aaa', fontSize: 12 }}>{item.date}</span>}
                  />
                  <div style={{ color: '#fff', marginBottom: 8 }}>
                    <Rate disabled defaultValue={5} style={{ fontSize: 14, color: '#f59e42', marginRight: 8 }} />
                    <span style={{ color: '#f59e42' }}>(80 đánh giá)</span> 
                  </div>
                  <div style={{ color: '#fff', marginBottom: 8 }}>{item.ratingText}</div>
                  <div>
                    {item.tags.map((tag, index) => (
                      <Tag key={index} style={{ background: '#444', color: '#eee', border: 'none', marginRight: 8, marginBottom: 4 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
