import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const defaultCenter = [16.0000, 107.8000]; // Default to Vietnam center

  const mapZoom = zoom || 0;
  
  const geocodeAddress = async (address) => {
    if (!address) {
      setCenter(null);
      return;
    }
    try {
      // Thêm "Vietnam" vào cuối địa chỉ để tăng độ chính xác
      const searchAddress = `${address}, Vietnam`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        setCenter(null);
        console.warn('Geocoding failed for address:', address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCenter(null);
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
        <Circle 
          center={center} 
          radius={radius} 
          pathOptions={{ 
            color: 'red', 
            fillColor: 'red', 
            fillOpacity: 0.2 
          }} 
        />
      )}
      {center && <MapUpdater center={center} zoom={mapZoom} />}
    </MapContainer>
  );
};

export default MapComponent;