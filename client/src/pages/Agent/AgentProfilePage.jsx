// src/pages/AgentProfilePage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Avatar, Button, Tag, Rate, Tabs, List, Spin, message, Row, Col, Divider } from 'antd';
import axiosPrivate from '../../api/axiosPrivate'; // Đảm bảo đường dẫn đúng
import { UserOutlined } from '@ant-design/icons';
import { PriceUnit, formatPrice } from '../../utils/priceUtils';
import {
  getAgentProfileById,
  getWardById,
  getDistrictById,
  getCityById,
  getCategoryById,
  
} from '../../services/agentProfileService';

const { TabPane } = Tabs;

export default function AgentProfilePage() {
  const { id } = useParams(); // Lấy ID của agent profile từ URL (ví dụ: /agent-profile/22)
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState(null);
  const [locationDetails, setLocationDetails] = useState(''); // Để chứa thông tin phường/xã, quận/huyện, tỉnh/thành phố
  const [districtCity, setDistrictCity] = useState(''); // Để chứa thông tin quận/huyện, tỉnh/thành phố
  const [categoryNames, setCategoryNames] = useState([]); // Thay đổi thành array để xử lý nhiều categories
  const [agentPosts, setAgentPosts] = useState([]); // State để lưu các bài đăng của agent
  const [featuredPosts, setFeaturedPosts] = useState([]); // State cho bài đăng nổi bật (có thể lấy từ API hoặc lọc từ agentPosts)
  const [customerReviews, setCustomerReviews] = useState([]); // State cho đánh giá

  const featuredRef = useRef(null);
  const postsRef = useRef(null);
  const reviewsRef = useRef(null);
  const [activeTabKey, setActiveTabKey] = useState('featured');
  const navigate = useNavigate(); // Dùng để navigate nếu cần

  useEffect(() => {
    const fetchFullAgentData = async () => {
      setLoading(true);
      try {
        const agentRes = await getAgentProfileById(id); // Lấy profile chính thức bằng ID
        console.log('AgentProfilePage - Agent data from backend:', agentRes); // Debug tạm thời
        console.log('AgentProfilePage - agentRes.areaNames:', agentRes?.areaNames); // Debug tạm thời
        console.log('AgentProfilePage - agentRes.areaIds:', agentRes?.areaIds); // Debug tạm thời
        console.log('AgentProfilePage - agentRes.transactionTypes:', agentRes?.transactionTypes); // Debug tạm thời
        console.log('AgentProfilePage - agentRes.categoryIds:', agentRes?.categoryIds); // Debug tạm thời
        
        // Tạo areaNames từ areaIds để đảm bảo nhất quán với AgentProfileOverviewPage
        if (agentRes?.areaIds?.length > 0) {
          const fetchedAreaCityPairs = await Promise.all(
            agentRes.areaIds.map(async (areaId) => {
              try {
                const area = await axiosPrivate.get(`/api/areas/districts/${areaId}`);
                if (area?.data?.cityId) {
                  const city = await getCityById(area.data.cityId);
                  return `${area.data.name}, ${city?.name || 'Unknown City'}`;
                }
                return area?.data?.name || null;
              } catch (err) {
                console.log(`Failed to fetch area with ID ${areaId}:`, err);
                return null;
              }
            })
          );
          const validAreaNames = fetchedAreaCityPairs.filter(name => name);
          // Luôn ghi đè areaNames từ backend bằng dữ liệu được tạo từ areaIds để đảm bảo nhất quán
          agentRes.areaNames = validAreaNames;
          console.log('AgentProfilePage - Created areaNames from areaIds:', validAreaNames); // Debug tạm thời
          console.log('AgentProfilePage - Created areaNames content:', validAreaNames?.map((name, idx) => `${idx}: "${name}"`)); // Debug tạm thời
        }
        
        setAgent(agentRes);

        // Fetch category names cho nhiều categories
        if (agentRes?.categoryIds?.length > 0) {
          const fetchedCategoryNames = await Promise.all(
            agentRes.categoryIds.map(async (categoryId) => {
              try {
                const category = await getCategoryById(categoryId);
                return category?.name || null;
              } catch (err) {
                console.error(`Failed to fetch category with ID ${categoryId}:`, err);
                return null;
              }
            })
          );
          setCategoryNames(fetchedCategoryNames.filter(name => name));
        }

        // Fetch location details (full address: ward, district, city)
        if (agentRes?.areaId) {
          try {
            const ward = await getWardById(agentRes.areaId);
            if (ward) {
              setLocationDetails(ward.name); // Mặc định chỉ lấy tên phường/xã trước
              if (ward.districtId) {
                const district = await getDistrictById(ward.districtId);
                if (district) {
                  setDistrictCity(`${district.name}`); // Quận/huyện
                  if (district.cityId) {
                    const city = await getCityById(district.cityId);
                    if (city) {
                      setDistrictCity(`${district.name}, ${city.name}`); // Quận/huyện, tỉnh/thành phố
                      setLocationDetails(`${ward.name}, ${district.name}, ${city.name}`); // Full địa chỉ
                    }
                  }
                }
              }
            }
          } catch (locErr) {
            console.error("Failed to fetch location details:", locErr);
            setLocationDetails('Không xác định');
            setDistrictCity('Không xác định');
          }
        }

        // --- BẮT ĐẦU: LẤY BÀI ĐĂNG CỦA AGENT ---
       if (agentRes?.id) { // Hoặc agentRes?.userId nếu post liên kết với userId
          try {
            
            const postsRes = await axiosPrivate.get(`/api/agent-profile/${agentRes.id}/posts`); // Ví dụ
            setAgentPosts(postsRes.data);
            //lọc bài đăng nổi bật
            setFeaturedPosts(postsRes.data.slice(0, 3)); // Lấy 3 bài đầu tiên làm nổi bật
          } catch (postsErr) {
            console.error("Failed to fetch agent posts:", postsErr);
            setAgentPosts([]);
            setFeaturedPosts([]);
          }
        }

        // --- BẮT ĐẦU: LẤY ĐÁNH GIÁ CỦA AGENT ---
        
        if (agentRes?.id) {
          try {
            const reviewsRes = await axiosPrivate.get(`/api/agent-profile/${agentRes.id}`); // Ví dụ
            setCustomerReviews(reviewsRes.data);
          } catch (reviewsErr) {
            console.error("Failed to fetch agent reviews:", reviewsErr);
            setCustomerReviews([]);
          }
        }
        

      } catch (err) {
        console.error('Error fetching official agent profile:', err);
        setError('Không thể tải dữ liệu chuyên trang. Vui lòng thử lại.');
        message.error('Không thể tải dữ liệu chuyên trang. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFullAgentData();
    }
  }, [id]);

  const handleTabChange = (key) => {
    setActiveTabKey(key);
    // Logic cuộn đến phần tử tương ứng (đảm bảo các ref được gắn đúng)
    if (key === 'featured' && featuredRef.current) {
      featuredRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'posts' && postsRef.current) {
      postsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'reviews' && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><Spin size="large" /></div>;
  }

  if (error) {
    return <Card style={{ maxWidth: 600, margin: '48px auto', textAlign: 'center' }}>{error}</Card>;
  }

  if (!agent) {
    return <Card style={{ maxWidth: 600, margin: '48px auto', textAlign: 'center' }}>Không tìm thấy chuyên trang.</Card>;
  }

  // Thêm hàm render khu vực hoạt động ưu tiên name
  const renderAreaNames = () => {
    console.log('renderAreaNames - agent:', agent); // Debug tạm thời
    console.log('renderAreaNames - agent.areaNames:', agent?.areaNames); // Debug tạm thời
    console.log('renderAreaNames - agent.areaNames content:', agent?.areaNames?.map((name, idx) => `${idx}: "${name}"`)); // Debug tạm thời
    
    // Ưu tiên sử dụng AreaNames từ backend nếu có
    if (agent && Array.isArray(agent.areaNames) && agent.areaNames.length > 0) {
      // Loại bỏ các khu vực trùng lặp
      const uniqueAreas = [...new Set(agent.areaNames)];
      console.log('renderAreaNames - uniqueAreas:', uniqueAreas); // Debug tạm thời
      console.log('renderAreaNames - uniqueAreas content:', uniqueAreas?.map((name, idx) => `${idx}: "${name}"`)); // Debug tạm thời
      return (
        <>
          {uniqueAreas.map((areaName, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>{areaName}</div>
          ))}
        </>
      );
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
    // Nếu không có, dùng logic cũ (districtCity)
    return districtCity || '---';
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
            src={`http://localhost:5134${agent.bannerUrl}`} // Đảm bảo đường dẫn ảnh đúng
            alt="Banner"
            style={{
              width: '100%',
              maxHeight: 260,
              objectFit: 'cover',
              borderRadius: 12,
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
            }}
          />
        </div>
      )}
      <Row gutter={32}>
        {/* Left: Agent Info */}
        <Col xs={24} md={7}>
          <Card style={{ background: '#232428', color: '#fff', marginBottom: 24 }} styles={{ body: { background: '#232428', color: '#fff' } }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar
                size={80}
                src={agent.avatarUrl ? `http://localhost:5134${agent.avatarUrl}` : null} // Đảm bảo đường dẫn ảnh đúng
                icon={<UserOutlined />}
                style={{ marginBottom: 8 }}
              />
              <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>{agent.shopName}</div>
              <Rate disabled defaultValue={agent.rating || 5} style={{ fontSize: 16, color: '#f59e42' }} />
              <span style={{ color: '#f59e42', marginLeft: 8 }}>({agent.totalReviews || 0} đánh giá)</span>
              <div style={{ margin: '8px 0', color: '#aaa' }}>Người theo dõi: {agent.followers || 0} | Tin đăng: {agentPosts.length}</div>
              {/* Trang chính thức thì không có nút Save & Pay */}
              <Tag color="green">Đã hoạt động</Tag>
            </div>
            <Divider style={{ background: '#333' }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>GIỚI THIỆU</div>
              <div>{agent.description || 'Chưa có mô tả.'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>KHU VỰC HOẠT ĐỘNG</div>
              <div>{renderAreaNames()}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>ĐỊA CHỈ</div>
              <div>{agent.address || '---'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>SỐ ĐIỆN THOẠI</div>
              <div>{agent.phoneNumber || '---'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#aaa', fontWeight: 500 }}>LOẠI HÌNH MÔI GIỚI</div>
              <div>{renderCategoryTransactionTypes()}</div>
            </div>
            <Button type="link" style={{ color: '#40a9ff', padding: 0 }}>Xem thêm thông tin &gt;</Button>
          </Card>
        </Col>
        {/* Right: Tabs and Posts */}
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
              grid={{ gutter: 16, column: featuredPosts.length > 0 ? featuredPosts.length : 1 }} // Đảm bảo ít nhất 1 cột
              dataSource={featuredPosts}
              locale={{ emptyText: <span style={{ color: '#aaa' }}>Không có bài đăng nổi bật nào.</span> }}
              renderItem={item => (
                <List.Item.Meta
                  avatar={
                    <Link to={`/chi-tiet/${item.id}`} style={{ color: '#fff', fontWeight: 600 }}>
                      <img
                        src={item.imageUrls && item.imageUrls.length > 0 ? `http://localhost:5134${item.imageUrls[0].url}` : ''}
                        alt={item.title}
                        style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 16, background: '#222' }}
                      />
                    </Link>
                  }
                  title={
                    <Link to={`/chi-tiet/${item.id}`} style={{ color: '#fff', fontWeight: 600 }}>
                      {item.title}
                    </Link>
                  }
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
                        {formatPrice(item.price, item.priceUnit)}
                        <span style={{ color: 'white', margin: '0 5px' }}>-</span>
                        <span style={{ color: 'white' }}>{item.area_Size} m²</span>
                      </div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>{item.timeAgo}</div>
                      <span style={{ color: '#aaa', fontSize: 12 }}>{item.areaName}</span>
                    </div>
                  }
                />
               
              )}
            />
            
          </div>

          <div ref={postsRef} style={{ background: '#232428', color: '#fff', padding: '16px 24px', borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0', color: '#fff' }}>Tin đăng của môi giới</div>
            <List
              itemLayout="horizontal"
              dataSource={agentPosts}
              locale={{ emptyText: <span style={{ color: '#aaa' }}>Chưa có tin đăng nào.</span> }}
              renderItem={item => (
                <List.Item style={{ background: '#232428', color: '#fff', borderBottom: '1px solid #333', alignItems: 'flex-start' }}>
                  <List.Item.Meta
                    avatar={
                      <Link to={`/chi-tiet/${item.id}`} style={{ color: '#fff', fontWeight: 600 }}>
                      <img
                        src={item.imageUrls && item.imageUrls.length > 0 ? `http://localhost:5134${item.imageUrls[0].url}` : ''}
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
                      </Link>
                    }
                    title={<Link to={`/chi-tiet/${item.id}`} style={{ color: '#fff', fontWeight: 600 }}>{item.title}</Link>}
                    description={
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
                          {formatPrice(item.price, item.priceUnit)}
                          <span style={{ color: 'white', margin: '0 5px' }}>-</span>
                          <span style={{ color: 'white' }}>{item.area_Size} m²</span>
                        </div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>{item.timeAgo}</div>
                        <span style={{ color: '#aaa', fontSize: 12 }}>{item.areaName}</span>
                      </div>
                    }
                  />
                  {/* <Button shape="circle" icon={<span style={{ color: '#fff' }}>&hearts;</span>} style={{ background: 'transparent', border: 'none' }} /> */}
                </List.Item>
              )}
            />
          </div>

          {/* <div ref={reviewsRef} style={{ background: '#232428', color: '#fff', padding: '16px 24px', borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0', color: '#fff' }}>Đánh giá từ khách hàng</div>
            <List
              itemLayout="vertical"
              dataSource={customerReviews}
              locale={{ emptyText: <span style={{ color: '#aaa' }}>Chưa có đánh giá nào.</span> }}
              renderItem={item => (
                <List.Item style={{ background: '#232428', color: '#fff', borderBottom: '1px solid #333', paddingBottom: 16, marginBottom: 16 }}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.reviewerAvatarUrl || null} icon={<UserOutlined />} />}
                    title={<span style={{ color: '#fff', fontWeight: 600 }}>{item.reviewerName || 'Khách hàng'}</span>}
                    description={<span style={{ color: '#aaa', fontSize: 12 }}>{item.reviewDate}</span>} 
                  />
                  <div style={{ color: '#fff', marginBottom: 8 }}>
                    <Rate disabled defaultValue={item.rating || 5} style={{ fontSize: 14, color: '#f59e42', marginRight: 8 }} />
                    
                  </div>
                  <div style={{ color: '#fff', marginBottom: 8 }}>{item.comment}</div>
                  <div>
                    {item.tags && item.tags.map((tag, index) => (
                      <Tag key={index} style={{ background: '#444', color: '#eee', border: 'none', marginRight: 8, marginBottom: 4 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          </div> */}
        </Col>
      </Row>
    </div>
  );
}