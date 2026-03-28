import { useState, useEffect } from 'react';
import { Modal, Button, message, Checkbox, Row, Col, Card, Tag } from 'antd';
import { getProvinces, getDistrictsByProvince } from '../../api/vietnamAddressService';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const AreaSelectionModal = ({ visible, onCancel, onOk, initialSelectedAreas }) => {
    const [cities, setCities] = useState([]);
    const [allDistricts, setAllDistricts] = useState({}); // Lưu tất cả districts theo cityCode
    const [selectedDistricts, setSelectedDistricts] = useState(initialSelectedAreas ? initialSelectedAreas.map(a => a.id || a.code) : []);
    const [selectedDistrictsData, setSelectedDistrictsData] = useState(initialSelectedAreas || []); // Lưu full data của districts đã chọn
    const [openCities, setOpenCities] = useState([]); // Thành phố nào đang mở danh sách quận

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const provinces = await getProvinces();
                setCities(provinces.map(p => ({ id: p.code, code: p.code, name: p.name })));
            } catch (error) {
                console.error('Failed to load cities:', error);
                message.error('Không thể tải danh sách tỉnh/thành phố');
            }
        };
        fetchCities();
    }, []);

    // Load districts cho một city
    const loadDistrictsForCity = async (cityCode) => {
        if (!allDistricts[cityCode]) {
            try {
                const districts = await getDistrictsByProvince(cityCode);
                setAllDistricts(prev => ({
                    ...prev,
                    [cityCode]: districts.map(d => ({ id: d.code, code: d.code, name: d.name }))
                }));
            } catch (error) {
                console.error('Failed to load districts for city:', cityCode, error);
                message.error('Không thể tải danh sách quận/huyện');
            }
        }
        setOpenCities(prev => prev.includes(cityCode) ? prev : [...prev, cityCode]);
    };
    const toggleCity = (cityCode) => {
        setOpenCities(prev => prev.includes(cityCode) ? prev.filter(id => id !== cityCode) : [...prev, cityCode]);
    };

    const handleDistrictChange = (checkedValues, cityCode) => {
        const currentDistricts = allDistricts[cityCode] || [];
        const currentCity = cities.find(c => c.code === cityCode || c.id === cityCode);
        const newSelectedDistricts = [...selectedDistricts];
        const newSelectedDistrictsData = [...selectedDistrictsData];

        // Xóa các districts của city này khỏi danh sách đã chọn
        const districtsToRemove = currentDistricts.map(d => d.id || d.code);
        const filteredSelectedDistricts = newSelectedDistricts.filter(id => !districtsToRemove.includes(id));
        const filteredSelectedDistrictsData = newSelectedDistrictsData.filter(d => !districtsToRemove.includes(d.id || d.code));

        // Thêm các districts mới được chọn với thông tin city
        const newlySelectedDistricts = currentDistricts
            .filter(d => checkedValues.includes(d.id || d.code))
            .map(d => ({
                ...d,
                id: d.id || d.code, // Đảm bảo có id (district code)
                districtName: d.name, // Lưu tên quận/huyện
                city: currentCity, // Thêm thông tin city object
                cityId: currentCity?.id || currentCity?.code,
                cityName: currentCity?.name || ''
            }));
        
        const finalSelectedDistricts = [...filteredSelectedDistricts, ...newlySelectedDistricts.map(d => d.id || d.code)];
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
        setSelectedDistrictsData(prev => prev.filter(d => (d.id || d.code) !== districtId));
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
                {cities.map(city => {
                    const cityKey = city.code || city.id;
                    return (
                        <Card
                            key={cityKey}
                            size="small"
                            style={{ marginBottom: 8 }}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{city.name}</span>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={openCities.includes(cityKey) ? <CloseOutlined /> : <PlusOutlined />}
                                        onClick={() => openCities.includes(cityKey) ? toggleCity(cityKey) : loadDistrictsForCity(cityKey)}
                                    >
                                        {openCities.includes(cityKey) ? 'Ẩn quận/huyện' : (allDistricts[cityKey] ? 'Xem quận/huyện' : 'Tải quận/huyện')}
                                    </Button>
                                </div>
                            }
                        >
                            {openCities.includes(cityKey) && allDistricts[cityKey] && (
                                <Checkbox.Group
                                    style={{ width: '100%' }}
                                    onChange={(checkedValues) => handleDistrictChange(checkedValues, cityKey)}
                                    value={selectedDistricts.filter(id => 
                                        allDistricts[cityKey].some(d => (d.id || d.code) === id)
                                    )}
                                >
                                    <Row gutter={[0, 8]}>
                                        {allDistricts[cityKey].map(district => (
                                            <Col span={12} key={district.id || district.code}>
                                                <Checkbox value={district.id || district.code}>{district.name}</Checkbox>
                                            </Col>
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            )}
                        </Card>
                    );
                })}
            </div>
        </Modal>
    );
};

export default AreaSelectionModal;

