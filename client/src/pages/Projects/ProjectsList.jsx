import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ProjectsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosClient.get('/api/projects?featured=true');
        setItems(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div>Đang tải dự án...</div>;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <h1 className="page-title">Dự án nổi bật</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16 }}>
        {items.map(p => {
          const priceRange = p.priceFrom && p.priceTo && p.priceUnit
            ? `${p.priceFrom} - ${p.priceTo} ${p.priceUnit === 'USDm2' ? 'USD/m²' : p.priceUnit}`
            : (p.priceFrom && p.priceUnit ? `Từ ${p.priceFrom} ${p.priceUnit}` : 'Đang cập nhật');
          const statusLabel = p.status === 'OpenForSale' ? 'Đang mở bán' : p.status === 'Delivered' ? 'Đã bàn giao' : p.status === 'Unverified' ? 'Chưa xác thực' : 'Sắp mở bán';
          return (
            <Link key={p.id} to={`/du-an/${p.slug}`} className="project-card" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111', color: '#fff', textDecoration: 'none' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#222' }}>
                {p.thumbnailUrl && (
                  <img src={p.thumbnailUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff4d4f', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>NỔI BẬT</span>
                <span style={{ position: 'absolute', top: 8, right: 8, background: '#1f1f1f', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>{statusLabel}</span>
              </div>
              <div style={{ padding: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{p.name}</h3>
                <div style={{ marginTop: 4, color: '#bbb', fontSize: 13 }}>{p.location || (p.area && p.area.name)}</div>
                <div style={{ marginTop: 8, fontWeight: 700, color: '#ffd666', fontSize: 14 }}>{priceRange}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsList;


