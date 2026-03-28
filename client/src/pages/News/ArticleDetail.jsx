import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axiosClient.get(`/api/articles/${slug}`);
        setArticle(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) return <div>Đang tải...</div>;
  if (!article) return <div>Không tìm thấy bài viết</div>;

  return (
    <div className="container">
      <h1>{article.title}</h1>
      {article.thumbnailUrl && (
        <img src={article.thumbnailUrl} alt={article.title} className="banner" />
      )}
      <div className="meta">
        <small>{new Date(article.publishedAt).toLocaleDateString()}</small>
      </div>
      <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
    </div>
  );
};

export default ArticleDetail;


