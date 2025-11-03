import React, { useState, useEffect, useRef } from 'react';

const StreetViewComponent = ({ address, lat, lng, height = 520 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullAddress, setFullAddress] = useState(address);
  const [coordinates, setCoordinates] = useState(null);
  const openedRef = useRef(false);

  useEffect(() => {
    const loadStreetView = async () => {
      setLoading(true);
      setError(null);

      try {
        let finalLat = lat;
        let finalLng = lng;

        // Nếu có lat/lng, sử dụng trực tiếp
        if (finalLat && finalLng) {
          console.debug('[StreetView] Using provided coords', { lat: finalLat, lng: finalLng });
          setCoordinates({ lat: finalLat, lng: finalLng });
          setLoading(false);
          return;
        }

        // Nếu không có lat/lng, geocode address
        if (address) {
          console.debug('[StreetView] Geocoding address', { address });
          const searchAddress = `${address}, Vietnam`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            finalLat = parseFloat(data[0].lat);
            finalLng = parseFloat(data[0].lon);
            
            setCoordinates({ lat: finalLat, lng: finalLng });
            setFullAddress(searchAddress);
            console.debug('[StreetView] Geocode success', { lat: finalLat, lng: finalLng, searchAddress });
          } else {
            console.warn('[StreetView] Geocode no result', { address: searchAddress });
            setError('Không tìm thấy địa chỉ trên bản đồ');
          }
        } else {
          console.warn('[StreetView] Missing address and coordinates');
          setError('Chưa có thông tin địa chỉ');
        }
      } catch (err) {
        console.error('[StreetView] Error during loadStreetView', err);
        setError('Không thể tải Street View');
      } finally {
        setLoading(false);
      }
    };

    loadStreetView();
  }, [address, lat, lng]);

  // Khi có tọa độ, tự động mở Google Maps Street View trong tab mới
  useEffect(() => {
    if (!coordinates) return;
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lng}`;
    if (!openedRef.current) {
      openedRef.current = true;
      try {
        const w = window.open(url, '_blank', 'noopener');
        if (w) w.focus();
      } catch {}
    }
  }, [coordinates]);

  if (loading) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#fff',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          <div>Đang tải Street View...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#fff',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div>{error}</div>
          {fullAddress && (
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Địa chỉ: {fullAddress}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#fff',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          <div>Chưa có Street View cho địa chỉ này</div>
          {fullAddress && (
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Địa chỉ: {fullAddress}
            </div>
          )}
        </div>
      </div>
    );
  }

  // UI: Hiển thị địa chỉ + nút mở Street View (fallback nếu popup bị chặn)
  if (coordinates) {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lng}`;
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Street View</div>
          {fullAddress && (
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>{fullAddress}</div>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Mở Street View trong tab mới
          </a>
        </div>
      </div>
    );
  }

  return null;
};

export default StreetViewComponent;

