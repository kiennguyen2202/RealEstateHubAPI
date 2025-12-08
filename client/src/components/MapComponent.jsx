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

const MapComponent = ({ address, radius = 200, zoom = 5, mapHeight = '400px' }) => {
  const [center, setCenter] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const defaultCenter = [16.0000, 107.8000]; 

  const mapZoom = zoom || 0;
  
  const geocodeAddress = async (address) => {
    if (!address) {
      setCenter(null);
      setAmenities([]);
      return;
    }
    try {
      const searchAddress = `${address}, Vietnam`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setCenter(coords);
        // Tìm tiện ích xung quanh sau khi có tọa độ
        fetchNearbyAmenities(address);
      } else {
        setCenter(null);
        setAmenities([]);
        console.warn('Geocoding failed for address:', address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCenter(null);
      setAmenities([]);
    }
  };

  const fetchNearbyAmenities = async (address) => {
    if (!address) return;
    
    setLoadingAmenities(true);
    try {
      const response = await axiosClient.get('/api/ai/nearby-amenities', {
        params: { address }
      });
      if (response.data && Array.isArray(response.data)) {
        // Lọc các tiện ích có tọa độ hợp lệ
        const validAmenities = response.data.filter(
          a => a.lat != null && a.lon != null && !isNaN(a.lat) && !isNaN(a.lon)
        );
        setAmenities(validAmenities);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenities([]);
    } finally {
      setLoadingAmenities(false);
    }
  };

  useEffect(() => {
    geocodeAddress(address);
  }, [address]);

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
      
      {/* Hiển thị các tiện ích xung quanh */}
      {amenities.map((amenity, index) => (
        amenity.lat && amenity.lon && (
          <Marker 
            key={index} 
            position={[amenity.lat, amenity.lon]}
            icon={L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <strong>{amenity.name}</strong><br />
              <em>{amenity.category || 'Tiện ích'}</em>
              {amenity.distanceMeters != null && (
                <>
                  <br />
                  <small>Khoảng cách: ~{Math.round(amenity.distanceMeters / 100) * 100} m</small>
                </>
              )}
            </Popup>
          </Marker>
        )
      ))}
      
      {center && <MapUpdater center={center} zoom={mapZoom} />}
    </MapContainer>
  );
};

export default MapComponent;