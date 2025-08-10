import React, { useState, useEffect } from 'react';
import { Card, Avatar, Rate, Tag, Input, Select, Row, Col, Button, Spin, message } from 'antd';
import { SearchOutlined, UserOutlined, TrophyOutlined, StarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosPrivate from '../../api/axiosPrivate';

const { Search } = Input;
const { Option } = Select;

const AgentListPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agentsWithAreaNames, setAgentsWithAreaNames] = useState([]);

  useEffect(() => {
    fetchAgents();
    fetchAreas();
    fetchCategories();
  }, []);

  // Xử lý areaNames cho tất cả agents giống như trong AgentProfilePage
  useEffect(() => {
    const processAgents = async () => {
      const processedAgents = await Promise.all(
        agents.map(async (agent) => {
          let areaNames = [];
          
          // Logic giống hệt AgentProfilePage
          if (agent.areaIds && agent.areaIds.length > 0) {
            const areaCityPairs = await Promise.all(
              agent.areaIds.map(async (areaId) => {
                try {
                  const area = await axiosPrivate.get(`/api/areas/districts/${areaId}`);
                  if (area?.data?.cityId) {
                    const city = await axiosPrivate.get(`/api/areas/cities/${area.data.cityId}`);
                    return {
                      district: area.data.name,
                      city: city?.data?.name || 'Unknown City',
                      cityId: area.data.cityId
                    };
                  }
                  return null;
                } catch (err) {
                  console.log(`Failed to fetch area with ID ${areaId}:`, err);
                  return null;
                }
              })
            );
            
            // Lọc bỏ các kết quả null
            const validAreaCityPairs = areaCityPairs.filter(pair => pair);
            
            // Gộp các district cùng city
            const cityGroups = {};
            validAreaCityPairs.forEach(pair => {
              if (!cityGroups[pair.cityId]) {
                cityGroups[pair.cityId] = {
                  districts: [],
                  city: pair.city
                };
              }
              cityGroups[pair.cityId].districts.push(pair.district);
            });
            
            // Tạo chuỗi areaNames theo format mới
            areaNames = Object.values(cityGroups).map(group => {
              const uniqueDistricts = [...new Set(group.districts)];
              return `${uniqueDistricts.join(', ')} (${group.city})`;
            });
          } else if (agent.areaNames && agent.areaNames.length > 0) {
            // Nếu có sẵn areaNames từ backend, cũng cần xử lý gộp
            const areaCityPairs = agent.areaNames.map(name => {
              const parts = name.split(', ');
              if (parts.length >= 2) {
                const district = parts[0];
                const city = parts.slice(1).join(', ');
                return { district, city };
              }
              return null;
            }).filter(pair => pair);
            
            // Gộp các district cùng city
            const cityGroups = {};
            areaCityPairs.forEach(pair => {
              if (!cityGroups[pair.city]) {
                cityGroups[pair.city] = {
                  districts: []
                };
              }
              cityGroups[pair.city].districts.push(pair.district);
            });
            
            // Tạo chuỗi areaNames theo format mới
            areaNames = Object.entries(cityGroups).map(([city, group]) => {
              const uniqueDistricts = [...new Set(group.districts)];
              return `${uniqueDistricts.join(', ')} (${city})`;
            });
          }
          
          return { ...agent, processedAreaNames: areaNames };
        })
      );
      setAgentsWithAreaNames(processedAgents);
    };
    
    if (agents.length > 0) {
      processAgents();
    }
  }, [agents]);

  // Tạo chuỗi khu vực: "Quận A, Quận B (Thành phố X)"
  const buildAreaText = (names) => {
    if (!Array.isArray(names) || names.length === 0) return '';
    const districts = new Set();
    const cities = new Set();
    names.forEach((n) => {
      if (typeof n !== 'string') return;
      const [districtPart, cityPart] = n.split(',').map(s => s && s.trim());
      if (districtPart) districts.add(districtPart);
      if (cityPart) cities.add(cityPart);
    });
    const districtStr = Array.from(districts).join(', ');
    const cityStr = Array.from(cities).join(', ');
    return cityStr ? `${districtStr} (${cityStr})` : districtStr;
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/api/agent-profile');
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      message.error('Không thể tải danh sách môi giới');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await axiosPrivate.get('/api/areas/cities');
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
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

  const filteredAgents = agentsWithAreaNames.filter(agent => {
    const matchesSearch = agent.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
     
     // Xử lý trùng lặp khu vực trong filter
     const uniqueAreaNames = agent.processedAreaNames ? [...new Set(agent.processedAreaNames)] : [];
     const matchesArea = selectedArea === 'all' || 
                        uniqueAreaNames.some(area => area.toLowerCase().includes(selectedArea.toLowerCase()));
     
     const matchesCategory = selectedCategory === 'all' || 
                            agent.categoryIds?.includes(parseInt(selectedCategory));
     
     return matchesSearch && matchesArea && matchesCategory;
   });

  const renderAgentCard = (agent) => (
    <Col xs={24} sm={12} lg={12} xl={12} key={agent.id}>
      <Card className="agent-card" bodyStyle={{ padding: 0, height: '100%' }}>
        {/* Cover banner */}
        <div className="agent-card-cover">
          {agent.bannerUrl ? (
            <img
              alt="Banner"
              src={`http://localhost:5134${agent.bannerUrl}`}
              style={{ width: '100%', height: 200, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: 200,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              <UserOutlined style={{ fontSize: 28 }} />
            </div>
          )}
        </div>
        
        {/* Content container with fixed height */}
        <div className="agent-content-container">
          {/* Avatar and main info */}
          <div className="agent-row">
            {/* Avatar */}
            <div className="agent-avatar-col">
              <Avatar
                size={80}
                src={agent.avatarUrl ? `http://localhost:5134${agent.avatarUrl}` : null}
                icon={<UserOutlined />}
                className="agent-avatar"
              />
            </div>
            
            {/* Main info */}
            <div className="agent-main-col">
              <div className="agent-title-line">
                <h3 className="agent-name">{agent.shopName || 'Chưa có tên'}</h3>
                <span className="follow-pill">Theo dõi</span>
              </div>
              <div className="agent-rating-line">
                <Rate disabled defaultValue={5} allowHalf style={{ fontSize: 16 }} />
                <span className="rating-count">5 (8)</span>
                
                {(agent.isPro === true || agent.isMembership === true || agent.membership === true || (agent.userRole && agent.userRole.toLowerCase() === 'Membership') || (agent.role && agent.role.toLowerCase() === 'Membership')) && (
                  <Tag color="gold" icon={<TrophyOutlined />} className="pro-badge">Pro</Tag>
                )}
              </div>
            </div>
          </div>

          {/* Description with fixed height */}
          <div className="agent-description-container">
            <p className="agent-brief">
              {agent.description || 'Chưa có mô tả'}
            </p>
          </div>

          {/* Area line */}
          <div className="agent-area-line">
            <EnvironmentOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            <span className="area-text">
              Khu vực: {(() => {
                const areaNames = agent.processedAreaNames || agent.areaNames || [];
                if (areaNames.length > 0) {
                  const uniqueAreas = [...new Set(areaNames)];
                  return uniqueAreas.join(', ');
                }
                return 'Chưa cập nhật';
              })()}
            </span>
          </div>

          {/* Actions */}
          <div className="agent-actions-rect">
            <Button className="contact-btn">Liên hệ</Button>
            <Link to={`/agent-profile/${agent.id}`}>
              <Button type="primary" className="posts-btn">Xem trang</Button>
            </Link>
          </div>
        </div>
      </Card>
    </Col>
  );

  return (
    <div style={{ 
      background: '#f5f5f5', 
      minHeight: '100vh', 
      padding: '24px 0' 
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32,
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#333',
            marginBottom: '16px'
          }}>
            Tìm Môi Giới Uy Tín
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            marginBottom: '24px'
          }}>
            Kết nối với những môi giới chuyên nghiệp, giàu kinh nghiệm
          </p>
          
          {/* Search and Filter */}
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Tìm kiếm môi giới..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Chọn khu vực"
                value={selectedArea}
                onChange={setSelectedArea}
                size="large"
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả khu vực</Option>
                {areas.map(area => (
                  <Option key={area.id} value={area.name}>
                    {area.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Chọn loại BĐS"
                value={selectedCategory}
                onChange={setSelectedCategory}
                size="large"
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả loại BĐS</Option>
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        {/* Results */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '16px'
          }}>
            {filteredAgents.length} môi giới được tìm thấy
          </h2>
        </div>

        {/* Agent Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredAgents.map(renderAgentCard)}
          </Row>
        )}

        {!loading && filteredAgents.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <h3 style={{ color: '#666', marginBottom: '8px' }}>Không tìm thấy môi giới</h3>
            <p style={{ color: '#999' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .agent-card {
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .agent-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .agent-card-cover { position: relative; width: 100%; }
        .agent-content-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          min-height: 280px;
        }
        .agent-row { 
          display: flex; 
          gap: 16px; 
          align-items: flex-start; 
          margin-bottom: 16px;
        }
        .agent-avatar-col { flex: 0 0 80px; display: flex; justify-content: center; }
        .agent-avatar { 
          border: 3px solid #fff; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
          margin-top: -40px; 
        }
        .agent-main-col { flex: 1; min-width: 0; }
        .agent-title-line { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          margin-bottom: 8px;
        }
        .agent-name { 
          margin: 0; 
          font-size: 18px; 
          font-weight: 700; 
          color: #222; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap; 
          flex: 1;
        }
        .follow-pill { 
          background: #ff6f00; 
          color: #fff; 
          padding: 4px 8px; 
          border-radius: 999px; 
          font-weight: 600; 
          font-size: 11px; 
          flex-shrink: 0;
        }
        .agent-rating-line { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          flex-wrap: wrap; 
        }
        .rating-count { color: #666; font-size: 12px; }
        .license-pill { display: inline-flex; align-items: center; gap: 6px; background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
        .pro-badge { padding: 2px 6px; border-radius: 6px; font-size: 11px; }
        .agent-description-container {
          flex: 1;
          margin-bottom: 16px;
          min-height: 60px;
        }
        .agent-brief { 
          margin: 0; 
          color: #444; 
          line-height: 1.4; 
          display: -webkit-box; 
          -webkit-line-clamp: 3; 
          -webkit-box-orient: vertical; 
          overflow: hidden;
          font-size: 13px;
        }
        .agent-area-line { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          margin-bottom: 16px; 
          color: #333; 
          font-size: 13px;
        }
        .area-text { font-weight: 500; }
        .agent-actions-rect { 
          display: flex; 
          gap: 12px; 
          margin-top: auto;
        }
        .contact-btn { flex: 0 0 100px; font-size: 12px; }
        .posts-btn { flex: 1; font-weight: 600; font-size: 12px; }
      `}</style>
    </div>
  );
};

export default AgentListPage; 