import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, message, Checkbox, Row, Col, Card, Tag } from 'antd';
import axiosPrivate from '../../api/axiosPrivate';
import { CloseOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const AreaSelectionModal = ({ visible, onCancel, onOk, initialSelectedAreas }) => {
    const [cities, setCities] = useState([]);
    const [allDistricts, setAllDistricts] = useState({}); // Lưu tất cả districts theo cityId
    const [selectedDistricts, setSelectedDistricts] = useState(initialSelectedAreas ? initialSelectedAreas.map(a => a.id) : []);
    const [selectedDistrictsData, setSelectedDistrictsData] = useState(initialSelectedAreas || []); // Lưu full data của districts đã chọn
    const [openCities, setOpenCities] = useState([]); // Thành phố nào đang mở danh sách quận

    useEffect(() => {
        axiosPrivate.get('/api/areas/cities').then(res => setCities(res.data));
    }, []);

    // Load districts cho một city
    const loadDistrictsForCity = async (cityId) => {
        if (!allDistricts[cityId]) {
            try {
                const response = await axiosPrivate.get(`/api/areas/cities/${cityId}/districts`);
                setAllDistricts(prev => ({
                    ...prev,
                    [cityId]: response.data
                }));
            } catch (error) {
                console.error('Failed to load districts for city:', cityId, error);
            }
        }
        setOpenCities(prev => prev.includes(cityId) ? prev : [...prev, cityId]);
    };
    const toggleCity = (cityId) => {
        setOpenCities(prev => prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]);
    };

    const handleDistrictChange = (checkedValues, cityId) => {
        const currentDistricts = allDistricts[cityId] || [];
        const newSelectedDistricts = [...selectedDistricts];
        const newSelectedDistrictsData = [...selectedDistrictsData];

        // Xóa các districts của city này khỏi danh sách đã chọn
        const districtsToRemove = currentDistricts.map(d => d.id);
        const filteredSelectedDistricts = newSelectedDistricts.filter(id => !districtsToRemove.includes(id));
        const filteredSelectedDistrictsData = newSelectedDistrictsData.filter(d => !districtsToRemove.includes(d.id));

        // Thêm các districts mới được chọn
        const newlySelectedDistricts = currentDistricts.filter(d => checkedValues.includes(d.id));
        
        const finalSelectedDistricts = [...filteredSelectedDistricts, ...newlySelectedDistricts.map(d => d.id)];
        const finalSelectedDistrictsData = [...filteredSelectedDistrictsData, ...newlySelectedDistricts];

        if (finalSelectedDistricts.length > 3) {
            message.warning('Bạn chỉ có thể chọn tối đa 3 khu vực.');
            return;
        }

        setSelectedDistricts(finalSelectedDistricts);
        setSelectedDistrictsData(finalSelectedDistrictsData);
    };

    const handleOk = () => {
        onOk(selectedDistrictsData);
    };

    const removeDistrict = (districtId) => {
        setSelectedDistricts(prev => prev.filter(id => id !== districtId));
        setSelectedDistrictsData(prev => prev.filter(d => d.id !== districtId));
    };

    return (
        <Modal
            title="Chọn khu vực hoạt động"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={onCancel}>Hủy</Button>,
                <Button key="submit" type="primary" onClick={handleOk} disabled={selectedDistricts.length === 0}>
                    Xác nhận ({selectedDistricts.length}/3)
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>Khu vực đã chọn:</div>
                <div style={{ minHeight: 40, padding: 8, border: '1px solid #d9d9d9', borderRadius: 6, background: '#fafafa' }}>
                    {selectedDistrictsData.length === 0 ? (
                        <span style={{ color: '#999' }}>Chưa chọn khu vực nào</span>
                    ) : (
                        selectedDistrictsData.map(district => (
                            <Tag
                                key={district.id}
                                closable
                                onClose={() => removeDistrict(district.id)}
                                style={{ margin: 2 }}
                            >
                                {district.name} ({district.city?.name || 'N/A'})
                            </Tag>
                        ))
                    )}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>Chọn khu vực:</div>
                {cities.map(city => (
                    <Card
                        key={city.id}
                        size="small"
                        style={{ marginBottom: 8 }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{city.name}</span>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={openCities.includes(city.id) ? <CloseOutlined /> : <PlusOutlined />}
                                    onClick={() => openCities.includes(city.id) ? toggleCity(city.id) : loadDistrictsForCity(city.id)}
                                >
                                    {openCities.includes(city.id) ? 'Ẩn quận/huyện' : (allDistricts[city.id] ? 'Xem quận/huyện' : 'Tải quận/huyện')}
                                </Button>
                            </div>
                        }
                    >
                        {openCities.includes(city.id) && allDistricts[city.id] && (
                            <Checkbox.Group
                                style={{ width: '100%' }}
                                onChange={(checkedValues) => handleDistrictChange(checkedValues, city.id)}
                                value={selectedDistricts.filter(id => 
                                    allDistricts[city.id].some(d => d.id === id)
                                )}
                            >
                                <Row gutter={[0, 8]}>
                                    {allDistricts[city.id].map(district => (
                                        <Col span={12} key={district.id}>
                                            <Checkbox value={district.id}>{district.name}</Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        )}
                    </Card>
                ))}
            </div>
        </Modal>
    );
};

export default AreaSelectionModal;

