import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const NewsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axiosClient.get('/api/articles');
        setItems(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div>Đang tải tin tức...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Tin tức</h1>
      <div className="list">
        {items.map(n => (
          <Link key={n.id} to={`/tin-tuc/${n.slug}`} className="list-item">
            {n.thumbnailUrl && <img src={n.thumbnailUrl} alt={n.title} />}
            <div>
              <h3>{n.title}</h3>
              <p>{n.excerpt}</p>
              <small>{new Date(n.publishedAt).toLocaleDateString()}</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewsList;


