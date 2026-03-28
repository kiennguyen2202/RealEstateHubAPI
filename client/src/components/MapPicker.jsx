import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, message, Tooltip } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for selected location
const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper function to validate LatLng
const isValidLatLng = (coords) => {
  if (!coords || !Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return Number.isFinite(latNum) && Number.isFinite(lngNum) && 
         latNum >= -90 && latNum <= 90 && 
         lngNum >= -180 && lngNum <= 180;
};

// Helper component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    // Kiểm tra center hợp lệ và map sẵn sàng trước khi update view
    if (!map || !isValidLatLng(center)) return;
    
    try {
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      // Dùng setView thay vì flyTo để tránh lỗi animation
      map.setView([lat, lng], zoom);
    } catch (error) {
      console.error('MapUpdater error:', error);
    }
  }, [center, map, zoom]);
  return null;
};

// Component để handle click events trên map
const MapClickHandler = ({ onLocationSelect, isPickerMode }) => {
  useMapEvents({
    click: (e) => {
      if (isPickerMode) {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      }
    },
  });
  return null;
};

const MapPicker = ({ 
  address, 
  latitude, 
  longitude, 
  zoom = 5, 
  mapHeight = '400px',
  onLocationChange,
  onAddressFromMap, // Callback mới để trả về địa chỉ parsed
  editable = true 
}) => {
  const defaultCenter = [16.0000, 107.8000]; // Việt Nam center
  
  // Khởi tạo center với giá trị hợp lệ ngay từ đầu
  const getInitialCenter = () => {
    if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
      return [parseFloat(latitude), parseFloat(longitude)];
    }
    return defaultCenter;
  };
  
  const [center, setCenter] = useState(getInitialCenter);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isPickerMode, setIsPickerMode] = useState(false);
  const [addressFromCoords, setAddressFromCoords] = useState('');
  const [currentZoom, setCurrentZoom] = useState(zoom || 5);
  const [amenities, setAmenities] = useState([]);

  // Fetch amenities từ API
  const fetchNearbyAmenities = useCallback(async (addr) => {
    if (!addr) return;
    
    console.log('🔍 MapPicker: Fetching amenities for:', addr);
    try {
      const response = await axiosClient.get('/api/ai/nearby-amenities', {
        params: { address: addr }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const validAmenities = response.data.filter(
          a => a.lat != null && a.lon != null && !isNaN(a.lat) && !isNaN(a.lon)
        );
        console.log('✅ MapPicker: Valid amenities:', validAmenities.length);
        if (validAmenities.length > 0) {
          setAmenities(validAmenities);
        }
      }
    } catch (error) {
      console.error('MapPicker: Error fetching amenities:', error);
    }
  }, []);

  // Reverse geocoding - lấy địa chỉ từ tọa độ và parse ra các thành phần
  const getAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi&addressdetails=1`,
        { headers: { 'User-Agent': 'RealEstateHub/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // Parse địa chỉ cho Việt Nam - xử lý trường hợp sát nhập hành chính
        // Nominatim có thể trả về: suburb, quarter, neighbourhood, village cho phường/xã
        // city_district, district, county cho quận/huyện
        // city, state, province cho tỉnh/thành phố
        
        let ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village || addr.town || '';
        let district = addr.city_district || addr.district || addr.county || '';
        let city = addr.city || addr.state || addr.province || '';
        
        // Xử lý trường hợp VN: nếu district trống, thử parse từ display_name
        if (!district && data.display_name) {
          const parts = data.display_name.split(',').map(p => p.trim());
          // Format thường là: số nhà, đường, phường, quận, thành phố, quốc gia
          // Hoặc: đường, phường, thành phố (nếu là thành phố trực thuộc TW)
          if (parts.length >= 3) {
            // Tìm phần có chứa "Quận", "Huyện", "Thị xã", "Thành phố" (cấp huyện)
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (part.match(/^(Quận|Huyện|Thị xã|Thành phố)\s/i) && !district) {
                district = part;
              }
              if (part.match(/^(Phường|Xã|Thị trấn)\s/i) && !ward) {
                ward = part;
              }
            }
            // Nếu vẫn không có district, lấy phần trước thành phố
            if (!district && city) {
              const cityIndex = parts.findIndex(p => p.includes(city) || city.includes(p));
              if (cityIndex > 0) {
                district = parts[cityIndex - 1];
              }
            }
          }
        }
        
        // Nếu ward trống, thử lấy từ display_name
        if (!ward && data.display_name) {
          const parts = data.display_name.split(',').map(p => p.trim());
          for (const part of parts) {
            if (part.match(/^(Phường|Xã|Thị trấn)\s/i)) {
              ward = part;
              break;
            }
          }
        }
        
        const parsedAddress = {
          fullAddress: data.display_name,
          ward,
          district,
          city,
          country: addr.country || 'Việt Nam',
          road: addr.road || addr.street || '',
          houseNumber: addr.house_number || '',
        };
        
        console.log('📍 Địa chỉ từ map:', parsedAddress);
        return parsedAddress;
      }
    } catch (error) {
      console.error('Lỗi reverse geocoding:', error);
    }
    return {
      fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      ward: '',
      district: '',
      city: '',
      country: 'Việt Nam',
      road: '',
      houseNumber: '',
    };
  }, []);

  // Handle location selection from map click
  const handleLocationSelect = useCallback(async (lat, lng) => {
    setSelectedPosition([lat, lng]);
    setCenter([lat, lng]);
    setCurrentZoom(17); // Zoom như khi chọn ward
    
    // Get address from coordinates
    const parsedAddr = await getAddressFromCoords(lat, lng);
    setAddressFromCoords(parsedAddr.fullAddress);
    
    // Notify parent component với tọa độ và địa chỉ đầy đủ
    if (onLocationChange) {
      onLocationChange(lat, lng, parsedAddr.fullAddress);
    }
    
    // Callback mới để trả về địa chỉ parsed cho parent
    if (onAddressFromMap) {
      onAddressFromMap(parsedAddr);
    }
    
    message.success(`Đã chọn vị trí: ${parsedAddr.fullAddress?.substring(0, 50)}...`);
    setIsPickerMode(false);
  }, [getAddressFromCoords, onLocationChange, onAddressFromMap]);

  // Get current location using browser geolocation
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    message.loading('Đang lấy vị trí hiện tại...', 0);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        message.destroy();
        const { latitude: lat, longitude: lng } = position.coords;
        await handleLocationSelect(lat, lng);
      },
      (error) => {
        message.destroy();
        console.error('Geolocation error:', error);
        let errorMsg = 'Không thể lấy vị trí hiện tại';
        if (error.code === 1) errorMsg = 'Bạn đã từ chối quyền truy cập vị trí';
        else if (error.code === 2) errorMsg = 'Không thể xác định vị trí';
        else if (error.code === 3) errorMsg = 'Hết thời gian chờ';
        message.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleLocationSelect]);

  // Update center khi latitude/longitude props thay đổi từ parent
  useEffect(() => {
    if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const coords = [lat, lng];
      
      // Chỉ update nếu tọa độ thực sự thay đổi
      if (!selectedPosition || 
          Math.abs(selectedPosition[0] - lat) > 0.0001 || 
          Math.abs(selectedPosition[1] - lng) > 0.0001) {
        setCenter(coords);
        setSelectedPosition(coords);
        setCurrentZoom(17);
        console.log('📍 Map updated from props:', lat, lng);
      }
    } else if (!selectedPosition) {
      setCenter(defaultCenter);
    }
  }, [latitude, longitude]);

  // Fetch amenities khi địa chỉ thay đổi
  useEffect(() => {
    if (address || addressFromCoords) {
      const addr = addressFromCoords || address;
      const timeoutId = setTimeout(() => {
        fetchNearbyAmenities(addr);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [address, addressFromCoords, fetchNearbyAmenities]);

  // Update zoom when prop changes
  useEffect(() => {
    if (zoom && !selectedPosition) {
      setCurrentZoom(zoom);
    }
  }, [zoom, selectedPosition]);

  return (
    <div style={{ position: 'relative' }}>
      {editable && (
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 1000,
          display: 'flex',
          gap: 8,
          flexDirection: 'column'
        }}>
          <Tooltip title={isPickerMode ? "Đang chọn vị trí - Click vào bản đồ" : "Bấm để chọn vị trí trên bản đồ"}>
            <Button
              type={isPickerMode ? "primary" : "default"}
              icon={<EnvironmentOutlined />}
              onClick={() => setIsPickerMode(!isPickerMode)}
              style={{ 
                backgroundColor: isPickerMode ? '#ff4d4f' : 'white',
                borderColor: isPickerMode ? '#ff4d4f' : '#d9d9d9'
              }}
            >
              {isPickerMode ? 'Đang chọn...' : 'Chấm điểm'}
            </Button>
          </Tooltip>
          <Tooltip title="Lấy vị trí hiện tại của bạn">
            <Button
              icon={<AimOutlined />}
              onClick={getCurrentLocation}
              style={{ backgroundColor: 'white' }}
            >
              Vị trí của tôi
            </Button>
          </Tooltip>
        </div>
      )}
      
      {isPickerMode && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: '#ff4d4f',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500
        }}>
          👆 Click vào bản đồ để chọn vị trí chính xác
        </div>
      )}

      <MapContainer 
        center={isValidLatLng(center) ? [Number(center[0]), Number(center[1])] : defaultCenter} 
        maxZoom={20}
        minZoom={4}
        zoom={currentZoom}
        scrollWheelZoom={true} 
        style={{ 
          width: '100%', 
          height: mapHeight,
          cursor: isPickerMode ? 'crosshair' : 'grab'
        }} 
        dragging={true}
        doubleClickZoom={!isPickerMode}
        attributionControl={false}
        zoomControl={true}
      >
        {/* OpenStreetMap - chi tiết đầy đủ */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler 
          onLocationSelect={handleLocationSelect} 
          isPickerMode={isPickerMode} 
        />

        {selectedPosition && (
          <Marker position={selectedPosition} icon={redIcon}>
            <Popup>
              <div style={{ maxWidth: 280 }}>
                <strong>📍 Vị trí đã chọn</strong><br />
                <small>Lat: {selectedPosition[0].toFixed(6)}</small><br />
                <small>Lng: {selectedPosition[1].toFixed(6)}</small>
                {addressFromCoords && (
                  <>
                    <hr style={{ margin: '8px 0' }} />
                    <small style={{ wordBreak: 'break-word' }}>{addressFromCoords}</small>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hiển thị các tiện ích xung quanh (amenities) */}
        {amenities.map((amenity, index) => (
          amenity.lat && amenity.lon && (
            (() => {
              // Chọn màu icon theo category
              const category = (amenity.category || '').toLowerCase();
              let iconColor = '#3b82f6';
              let emoji = '📍';
              
              if (category.includes('school') || category.includes('trường') || category.includes('education')) {
                iconColor = '#f97316';
                emoji = '🏫';
              } else if (category.includes('hospital') || category.includes('bệnh viện') || category.includes('health') || category.includes('y tế')) {
                iconColor = '#ef4444';
                emoji = '🏥';
              } else if (category.includes('restaurant') || category.includes('food') || category.includes('ăn') || category.includes('cafe') || category.includes('coffee')) {
                iconColor = '#22c55e';
                emoji = '🍽️';
              } else if (category.includes('shop') || category.includes('market') || category.includes('siêu thị') || category.includes('mua sắm')) {
                iconColor = '#8b5cf6';
                emoji = '🛒';
              } else if (category.includes('bank') || category.includes('ngân hàng') || category.includes('atm')) {
                iconColor = '#eab308';
                emoji = '🏦';
              } else if (category.includes('park') || category.includes('công viên')) {
                iconColor = '#22c55e';
                emoji = '🌳';
              }
              
              return (
                <Marker 
                  key={`amenity-${index}`} 
                  position={[amenity.lat, amenity.lon]}
                  icon={L.divIcon({
                    className: 'custom-amenity-icon',
                    html: `<div style="
                      background: white;
                      border: 2px solid ${iconColor};
                      border-radius: 50%;
                      width: 28px;
                      height: 28px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 14px;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    ">${emoji}</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14]
                  })}
                >
                  <Popup>
                    <div style={{ minWidth: 140 }}>
                      <strong style={{ fontSize: 13 }}>{emoji} {amenity.name}</strong><br />
                      <span style={{ color: '#666', fontSize: 11 }}>{amenity.category || 'Tiện ích'}</span>
                      {amenity.distanceMeters != null && (
                        <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                          📏 ~{amenity.distanceMeters < 1000 ? `${Math.round(amenity.distanceMeters)} m` : `${(amenity.distanceMeters / 1000).toFixed(1)} km`}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })()
          )
        ))}

        {isValidLatLng(center) && (
          <MapUpdater center={center} zoom={currentZoom} />
        )}
      </MapContainer>

      {selectedPosition && addressFromCoords && (
        <div style={{ 
          marginTop: 8, 
          padding: '12px 16px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 8,
          fontSize: 13
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <strong>Vị trí đã chọn từ bản đồ</strong>
          </div>
          <div style={{ color: '#333', marginBottom: 4 }}>
            <strong>Tọa độ:</strong> {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
          </div>
          <div style={{ color: '#666', wordBreak: 'break-word' }}>
            <strong>Địa chỉ:</strong> {addressFromCoords}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
