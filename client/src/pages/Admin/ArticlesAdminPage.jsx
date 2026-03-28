import React, { useEffect, useState } from 'react';
import axiosPrivate from '../../api/axiosPrivate';
import { Layout, Card, Table, Button, Input, Select, Checkbox, message, Space, Divider } from 'antd';
import Sidebar from '../../components/Sidebar';

const { Content } = Layout;

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', category: 'General',
  thumbnailUrl: '', isPublished: true, isFeatured: false,
  authorName: '', tags: '', seoTitle: '', seoDescription: '', readingMinutes: ''
};

const ArticlesAdminPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const res = await axiosPrivate.get('/api/articles');
    setItems(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, readingMinutes: form.readingMinutes ? Number(form.readingMinutes) : null };
    if (editingId) {
      await axiosPrivate.put(`/api/articles/${editingId}`, payload);
    } else {
      await axiosPrivate.post('/api/articles', payload);
    }
    message.success('Lưu bài viết thành công');
    setForm(emptyForm); setEditingId(null); await load();
  };

  const edit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt || '', content: a.content || '', category: a.category || 'General',
      thumbnailUrl: a.thumbnailUrl || '', isPublished: !!a.isPublished, isFeatured: !!a.isFeatured,
      authorName: a.authorName || '', tags: a.tags || '', seoTitle: a.seoTitle || '', seoDescription: a.seoDescription || '', readingMinutes: a.readingMinutes || ''
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa bài viết?')) return;
    await axiosPrivate.delete(`/api/articles/${id}`);
    await load();
  };

  return (
    <Layout style={{ minHeight: '100vh'}}>
      <Sidebar />
      <Layout>
        <Content style={{ margin: '24px 16px 0px', background: '#141414'}}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản trị Tin tức</h1>

          <Card style={{ marginTop: 16 }}>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card size="small" title="Thông tin chính">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input placeholder="Tiêu đề" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
                    <Input placeholder="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required />
                    <Select value={form.category} onChange={(v)=>setForm({...form,category:v})} options={[{value:'General',label:'Tổng hợp'},{value:'Market',label:'Thị trường'},{value:'Guide',label:'Hướng dẫn'},{value:'Project',label:'Dự án'},{value:'Company',label:'Doanh nghiệp'}]} />
                    <Input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={e=>setForm({...form,thumbnailUrl:e.target.value})} />
                    <Space>
                      <Checkbox checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})}>Xuất bản</Checkbox>
                      <Checkbox checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})}>Nổi bật</Checkbox>
                    </Space>
                  </Space>
                </Card>

                <Card size="small" title="SEO & Meta">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input placeholder="Tác giả" value={form.authorName} onChange={e=>setForm({...form,authorName:e.target.value})} />
                    <Input placeholder="Tags (phân tách bằng dấu phẩy)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
                    <Input placeholder="SEO Title" value={form.seoTitle} onChange={e=>setForm({...form,seoTitle:e.target.value})} />
                    <Input placeholder="SEO Description" value={form.seoDescription} onChange={e=>setForm({...form,seoDescription:e.target.value})} />
                    <Input placeholder="Phút đọc" value={form.readingMinutes} onChange={e=>setForm({...form,readingMinutes:e.target.value})} />
                  </Space>
                </Card>
              </div>

              <Divider />

              <Card size="small" title="Nội dung bài viết">
                <Input.TextArea placeholder="Tóm tắt" value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} rows={3} />
                <Input.TextArea placeholder="Nội dung" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={10} style={{ marginTop: 8 }} />
              </Card>

              <div style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit">{editingId ? 'Cập nhật' : 'Tạo mới'}</Button>
                {editingId && <Button style={{ marginLeft: 8 }} onClick={()=>{setEditingId(null);setForm(emptyForm);}}>Hủy</Button>}
              </div>
            </form>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Table
              rowKey="id"
              dataSource={items}
              columns={[
                { title: 'Tiêu đề', dataIndex: 'title' },
                { title: 'Slug', dataIndex: 'slug' },
                { title: 'Danh mục', dataIndex: 'category' },
                { title: 'Xuất bản', dataIndex: 'isPublished', render: v => v ? '✓' : '' },
                { title: '', render: (_, r) => (
                  <>
                    <Button size="small" onClick={()=>edit(r)}>Sửa</Button>
                    <Button size="small" danger style={{ marginLeft: 6 }} onClick={()=>remove(r.id)}>Xóa</Button>
                  </>
                )}
              ]}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ArticlesAdminPage;


