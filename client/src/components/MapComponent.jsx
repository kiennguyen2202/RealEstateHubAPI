import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosClient from '../api/axiosClient';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, map, zoom]);
  return null;
};

const MapComponent = ({ address, latitude, longitude, radius = 200, zoom = 5, mapHeight = '400px' }) => {
  const [center, setCenter] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const defaultCenter = [16.0000, 107.8000]; 

  const mapZoom = zoom || 0;
  
  // Offline coordinates database - không cần internet
  const offlineCoordinates = {
    // Thành phố - format từ API công khai
    "Thành phố Hà Nội": [21.0285, 105.8542],
    "Hà Nội": [21.0285, 105.8542],
    "Thành phố Hồ Chí Minh": [10.8231, 106.6297],
    "TP Hồ Chí Minh": [10.8231, 106.6297],
    "Thành phố Đà Nẵng": [16.0471, 108.2068],
    "Đà Nẵng": [16.0471, 108.2068],
    "Thành phố Hải Phòng": [20.8449, 106.6881],
    "Hải Phòng": [20.8449, 106.6881],
    "Thành phố Cần Thơ": [10.0452, 105.7469],
    "Cần Thơ": [10.0452, 105.7469],
    
    // Quận Hà Nội - format từ API công khai
    "Quận Ba Đình, Thành phố Hà Nội": [21.0341, 105.8372],
    "Quận Ba Đình, Hà Nội": [21.0341, 105.8372],
    "Quận Hoàn Kiếm, Thành phố Hà Nội": [21.0285, 105.8542],
    "Quận Hoàn Kiếm, Hà Nội": [21.0285, 105.8542],
    "Quận Đống Đa, Thành phố Hà Nội": [21.0144, 105.8342],
    "Quận Đống Đa, Hà Nội": [21.0144, 105.8342],
    "Quận Hai Bà Trưng, Thành phố Hà Nội": [21.0067, 105.8441],
    "Quận Hai Bà Trưng, Hà Nội": [21.0067, 105.8441],
    "Quận Cầu Giấy, Thành phố Hà Nội": [21.0333, 105.7947],
    "Quận Cầu Giấy, Hà Nội": [21.0333, 105.7947],
    "Quận Thanh Xuân, Thành phố Hà Nội": [20.9897, 105.8072],
    "Quận Thanh Xuân, Hà Nội": [20.9897, 105.8072],
    "Quận Tây Hồ, Thành phố Hà Nội": [21.0583, 105.8200],
    "Quận Tây Hồ, Hà Nội": [21.0583, 105.8200],
    "Quận Long Biên, Thành phố Hà Nội": [21.0364, 105.8897],
    "Quận Long Biên, Hà Nội": [21.0364, 105.8897],
    
    // Quận TP HCM
    "Quận 1, Thành phố Hồ Chí Minh": [10.7769, 106.7009],
    "Quận 1, TP Hồ Chí Minh": [10.7769, 106.7009],
    "Quận 3, Thành phố Hồ Chí Minh": [10.7756, 106.6917],
    "Quận 3, TP Hồ Chí Minh": [10.7756, 106.6917],
    "Quận 5, Thành phố Hồ Chí Minh": [10.7594, 106.6672],
    "Quận 5, TP Hồ Chí Minh": [10.7594, 106.6672],
    "Quận 7, Thành phố Hồ Chí Minh": [10.7378, 106.7197],
    "Quận 7, TP Hồ Chí Minh": [10.7378, 106.7197],
    "Quận Bình Tân, Thành phố Hồ Chí Minh": [10.7394, 106.6050],
    "Quận Bình Tân, TP Hồ Chí Minh": [10.7394, 106.6050],
    "Quận Tân Bình, Thành phố Hồ Chí Minh": [10.8008, 106.6530],
    "Quận Tân Bình, TP Hồ Chí Minh": [10.8008, 106.6530],
    
    // Phường Ba Đình - format từ API công khai
    "Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội": [21.0419, 105.8347],
    "Phường Phúc Xá, Quận Ba Đình, Hà Nội": [21.0419, 105.8347],
    "Phường Trúc Bạch, Quận Ba Đình, Thành phố Hà Nội": [21.0456, 105.8372],
    "Phường Trúc Bạch, Quận Ba Đình, Hà Nội": [21.0456, 105.8372],
    "Phường Vĩnh Phúc, Quận Ba Đình, Thành phố Hà Nội": [21.0394, 105.8394],
    "Phường Vĩnh Phúc, Quận Ba Đình, Hà Nội": [21.0394, 105.8394],
    "Phường Cống Vị, Quận Ba Đình, Thành phố Hà Nội": [21.0356, 105.8347],
    "Phường Cống Vị, Quận Ba Đình, Hà Nội": [21.0356, 105.8347],
    "Phường Liễu Giai, Quận Ba Đình, Thành phố Hà Nội": [21.0331, 105.8372],
    "Phường Liễu Giai, Quận Ba Đình, Hà Nội": [21.0331, 105.8372],
    "Phường Nguyễn Trung Trực, Quận Ba Đình, Thành phố Hà Nội": [21.0306, 105.8347],
    "Phường Nguyễn Trung Trực, Quận Ba Đình, Hà Nội": [21.0306, 105.8347],
    "Phường Quán Thánh, Quận Ba Đình, Thành phố Hà Nội": [21.0281, 105.8372],
    "Phường Quán Thánh, Quận Ba Đình, Hà Nội": [21.0281, 105.8372],
    "Phường Ngọc Hà, Quận Ba Đình, Thành phố Hà Nội": [21.0356, 105.8394],
    "Phường Ngọc Hà, Quận Ba Đình, Hà Nội": [21.0356, 105.8394],
    "Phường Điện Biên, Quận Ba Đình, Thành phố Hà Nội": [21.0306, 105.8394],
    "Phường Điện Biên, Quận Ba Đình, Hà Nội": [21.0306, 105.8394],
    "Phường Đội Cấn, Quận Ba Đình, Thành phố Hà Nội": [21.0281, 105.8347],
    "Phường Đội Cấn, Quận Ba Đình, Hà Nội": [21.0281, 105.8347],
    "Phường Ngọc Khánh, Quận Ba Đình, Thành phố Hà Nội": [21.0256, 105.8372],
    "Phường Ngọc Khánh, Quận Ba Đình, Hà Nội": [21.0256, 105.8372],
    "Phường Kim Mã, Quận Ba Đình, Thành phố Hà Nội": [21.0231, 105.8347],
    "Phường Kim Mã, Quận Ba Đình, Hà Nội": [21.0231, 105.8347],
    "Phường Giảng Võ, Quận Ba Đình, Thành phố Hà Nội": [21.0206, 105.8372],
    "Phường Giảng Võ, Quận Ba Đình, Hà Nội": [21.0206, 105.8372],
    "Phường Thành Công, Quận Ba Đình, Thành phố Hà Nội": [21.0181, 105.8347],
    "Phường Thành Công, Quận Ba Đình, Hà Nội": [21.0181, 105.8347],
  };
  
  const getCoordinatesOffline = (address) => {
    if (!address) return null;
    
    // Tìm exact match trước
    const exactCoords = offlineCoordinates[address];
    if (exactCoords) {
      console.log(`📍 Found offline coordinates for: ${address}`, exactCoords);
      return exactCoords;
    }
    
    // Tìm partial match - thử các phần của địa chỉ
    const addressParts = address.split(', ');
    for (let i = 0; i < addressParts.length; i++) {
      const partialAddress = addressParts.slice(i).join(', ');
      const partialCoords = offlineCoordinates[partialAddress];
      if (partialCoords) {
        console.log(`📍 Found offline coordinates for partial: ${partialAddress}`, partialCoords);
        return partialCoords;
      }
    }
    
    // Tìm theo key chứa một phần của địa chỉ
    for (const [key, coords] of Object.entries(offlineCoordinates)) {
      if (address.includes(key) || key.includes(address)) {
        console.log(`📍 Found offline coordinates by partial match: ${key}`, coords);
        return coords;
      }
    }
    
    console.warn(`❌ No offline coordinates found for: ${address}`);
    return null;
  };

  const fetchNearbyAmenities = async (address) => {
    if (!address) return;
    
    console.log('🔍 Fetching amenities for:', address);
    try {
      const response = await axiosClient.get('/api/ai/nearby-amenities', {
        params: { address }
      });
      console.log('📍 Amenities response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const validAmenities = response.data.filter(
          a => a.lat != null && a.lon != null && !isNaN(a.lat) && !isNaN(a.lon)
        );
        console.log('✅ Valid amenities:', validAmenities.length, validAmenities);
        // Chỉ set amenities nếu có data hợp lệ
        if (validAmenities.length > 0) {
          setAmenities(validAmenities);
        }
      } else {
        console.log('❌ No amenities data or not array');
        // Không reset amenities nếu API trả về rỗng, có thể là lỗi tạm thời
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
      // Không reset amenities khi có lỗi
    }
  };

  useEffect(() => {
    // Ưu tiên dùng tọa độ chính xác từ ward
    if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
      const coords = [parseFloat(latitude), parseFloat(longitude)];
      setCenter(coords);
    } else if (address) {
      // Dùng offline coordinates cho city/district
      const coords = getCoordinatesOffline(address);
      setCenter(coords);
    } else {
      setCenter(null);
      setAmenities([]);
      return;
    }

    // Debounce amenities fetch
    const timeoutId = setTimeout(() => {
      if (address) {
        fetchNearbyAmenities(address);
      }
    }, 500); // Đợi 500ms trước khi fetch

    return () => clearTimeout(timeoutId);
  }, [address, latitude, longitude]);

  return (
    <MapContainer 
      center={center || defaultCenter} 
      maxZoom={20}
      minZoom={4}
      zoom={mapZoom}
      scrollWheelZoom={true} 
      style={{ width: '100%', height: mapHeight }} 
      dragging={true}
      doubleClickZoom={true}
      attributionControl={false}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />

      {center && (
        <>
          <Circle 
            center={center} 
            radius={radius} 
            pathOptions={{ 
              color: 'red', 
              fillColor: 'red', 
              fillOpacity: 0.2 
            }} 
          />
          <Marker position={center}>
            <Popup>
              <strong>Địa chỉ:</strong><br />
              {address}
            </Popup>
          </Marker>
        </>
      )}
      
      {/* Hiển thị các tiện ích xung quanh với icon theo loại */}
      {amenities.map((amenity, index) => {
        if (!amenity.lat || !amenity.lon) return null;
        
        // Chọn màu icon theo category
        const category = (amenity.category || '').toLowerCase();
        let iconColor = 'blue';
        let emoji = '📍';
        
        if (category.includes('school') || category.includes('trường') || category.includes('education')) {
          iconColor = 'orange';
          emoji = '🏫';
        } else if (category.includes('hospital') || category.includes('bệnh viện') || category.includes('health') || category.includes('y tế')) {
          iconColor = 'red';
          emoji = '🏥';
        } else if (category.includes('restaurant') || category.includes('food') || category.includes('ăn') || category.includes('cafe') || category.includes('coffee')) {
          iconColor = 'green';
          emoji = '🍽️';
        } else if (category.includes('shop') || category.includes('market') || category.includes('siêu thị') || category.includes('mua sắm')) {
          iconColor = 'violet';
          emoji = '🛒';
        } else if (category.includes('bank') || category.includes('ngân hàng') || category.includes('atm')) {
          iconColor = 'gold';
          emoji = '🏦';
        } else if (category.includes('park') || category.includes('công viên')) {
          iconColor = 'green';
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
                border: 2px solid ${iconColor === 'orange' ? '#f97316' : iconColor === 'red' ? '#ef4444' : iconColor === 'green' ? '#22c55e' : iconColor === 'violet' ? '#8b5cf6' : iconColor === 'gold' ? '#eab308' : '#3b82f6'};
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">${emoji}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            })}
          >
            <Popup>
              <div style={{ minWidth: 150 }}>
                <strong style={{ fontSize: 14 }}>{emoji} {amenity.name}</strong><br />
                <span style={{ color: '#666', fontSize: 12 }}>{amenity.category || 'Tiện ích'}</span>
                {amenity.distanceMeters != null && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                    📏 Khoảng cách: ~{amenity.distanceMeters < 1000 ? `${Math.round(amenity.distanceMeters)} m` : `${(amenity.distanceMeters / 1000).toFixed(1)} km`}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {center && <MapUpdater center={center} zoom={mapZoom} />}
    </MapContainer>
  );
};

export default MapComponent;
