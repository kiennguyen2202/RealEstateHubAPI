import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ProjectDetail = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axiosClient.get(`/api/projects/${slug}`);
        setProject(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [slug]);

  if (loading) return <div>Đang tải...</div>;
  if (!project) return <div>Không tìm thấy dự án</div>;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{project.name}</h1>
          {project.thumbnailUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <img src={project.thumbnailUrl} alt={project.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          {project.videoUrl && (
            <div style={{ marginBottom: 16 }}>
              {project.videoUrl.includes('youtube') || project.videoUrl.includes('youtu.be') ? (
                <iframe
                  title="project-video"
                  width="100%"
                  height="420"
                  style={{ border: 0, borderRadius: 12 }}
                  src={project.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video src={project.videoUrl} controls style={{ width: '100%', borderRadius: 12 }} />
              )}
            </div>
          )}

          <section style={{ marginTop: 24 }}>
            <h2>Giới thiệu</h2>
            {project.shortDescription && <p>{project.shortDescription}</p>}
            <div dangerouslySetInnerHTML={{ __html: project.description || '' }} />
          </section>

          {project.images && project.images.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <h2>Hình ảnh</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                {project.images.sort((a,b)=> (a.order||0)-(b.order||0)).map((img) => (
                  <div key={img.id || img.url} style={{ borderRadius: 10, overflow: 'hidden', background: '#111' }}>
                    <img src={img.url} alt={img.caption || project.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ padding: 16, border: '1px solid #222', borderRadius: 12 }}>
              <h3>Thông tin dự án</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
                {project.location && <li><strong>Vị trí:</strong> {project.location}</li>}
                {project.area && <li><strong>Khu vực:</strong> {project.area.name}</li>}
                {project.investor && <li><strong>Chủ đầu tư:</strong> {project.investor}</li>}
                {project.designer && <li><strong>Thiết kế:</strong> {project.designer}</li>}
                {project.scaleSummary && <li><strong>Quy mô:</strong> {project.scaleSummary}</li>}
                {project.productTypes && <li><strong>Loại sản phẩm:</strong> {project.productTypes}</li>}
                {project.legalStatus && <li><strong>Pháp lý:</strong> {project.legalStatus}</li>}
                {project.timeline && <li><strong>Tiến độ:</strong> {project.timeline}</li>}
                {project.priceFrom && <li><strong>Giá từ:</strong> {project.priceFrom}</li>}
                {project.priceTo && <li><strong>Giá đến:</strong> {project.priceTo}</li>}
                {project.priceUnit && <li><strong>Đơn vị giá:</strong> {project.priceUnit}</li>}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;


