import React, { useEffect, useState } from 'react';
import axiosPrivate from '../../api/axiosPrivate';
import { Layout, Card, Table, Button, Input, Select, Checkbox, Form, message, Space, Divider } from 'antd';
import Sidebar from '../../components/Sidebar';

const { Content } = Layout;

const emptyForm = {
  name: '', slug: '', location: '', cityId: '', districtId: '', areaId: '', type: '',
  status: 'Upcoming', priceFrom: '', priceTo: '', priceUnit: '', shortDescription: '',
  description: '', thumbnailUrl: '', isFeatured: false,
  investor: '', designer: '', scaleSummary: '', productTypes: '', legalStatus: '', timeline: '',
  images: []
};

const ProjectsAdminPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardId, setSelectedWardId] = useState(null);

  const load = async () => {
    const res = await axiosPrivate.get('/api/projects');
    setItems(res.data || []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesRes = await axiosPrivate.get('/api/areas/cities');
        setCities(citiesRes.data || []);
      } catch {
        setCities([]);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedCityId) { setDistricts([]); return; }
      try {
        const res = await axiosPrivate.get(`/api/areas/cities/${selectedCityId}/districts`);
        setDistricts(res.data || []);
      } catch {
        setDistricts([]);
      }
    };
    fetchDistricts();
    setSelectedDistrictId(null);
    setSelectedWardId(null);
    setWards([]);
  }, [selectedCityId]);

  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrictId) { setWards([]); return; }
      try {
        const res = await axiosPrivate.get(`/api/areas/districts/${selectedDistrictId}/wards`);
        setWards(res.data || []);
      } catch {
        setWards([]);
      }
    };
    fetchWards();
    setSelectedWardId(null);
  }, [selectedDistrictId]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
      priceTo: form.priceTo ? Number(form.priceTo) : null,
      areaId: form.areaId ? Number(form.areaId) : null,
      cityId: selectedCityId ? Number(selectedCityId) : null,
      districtId: selectedDistrictId ? Number(selectedDistrictId) : null,
      priceUnit: form.priceUnit || null
    };
    if (editingId) {
      await axiosPrivate.put(`/api/projects/${editingId}`, payload, { headers: { 'Content-Type': 'application/json' } });
    } else {
      await axiosPrivate.post('/api/projects', payload, { headers: { 'Content-Type': 'application/json' } });
    }
    message.success('Lưu dự án thành công');
    setForm(emptyForm); setEditingId(null); await load();
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug, location: p.location || '', cityId: p.cityId || '', districtId: p.districtId || '', areaId: p.areaId || '',
      type: p.type || '', status: p.status || 'Upcoming', priceFrom: p.priceFrom || '', priceTo: p.priceTo || '', priceUnit: p.priceUnit || '',
      shortDescription: p.shortDescription || '', description: p.description || '', thumbnailUrl: p.thumbnailUrl || '', isFeatured: !!p.isFeatured,
      investor: p.investor || '', designer: p.designer || '', scaleSummary: p.scaleSummary || '', productTypes: p.productTypes || '', legalStatus: p.legalStatus || '', timeline: p.timeline || '',
      images: (p.images || []).map(i => ({ url: i.url, caption: i.caption, order: i.order }))
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa dự án?')) return;
    await axiosPrivate.delete(`/api/projects/${id}`);
    await load();
  };

  return (
    <Layout style={{ minHeight: '100vh'}}>
      <Sidebar />
      <Layout>
        <Content style={{ margin: '24px 16px 0px', background: '#141414'}}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Quản trị Dự án</h1>

          <Card style={{ marginTop: 16 }}>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card size="small" title="Thông tin cơ bản">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input placeholder="Tên" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                    <Input placeholder="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required />
                    <Input placeholder="Vị trí (địa chỉ ngắn)" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Select
                        showSearch
                        placeholder="Chọn Tỉnh/Thành (City)"
                        value={selectedCityId || undefined}
                        onChange={(v)=>setSelectedCityId(v)}
                        options={(cities || []).map(c=>({ value: c.id, label: c.name }))}
                        allowClear
                      />
                      <Select
                        showSearch
                        placeholder="Chọn Quận/Huyện (District)"
                        value={selectedDistrictId || undefined}
                        onChange={(v)=>setSelectedDistrictId(v)}
                        options={(districts || []).map(d=>({ value: d.id, label: d.name }))}
                        disabled={!selectedCityId}
                        allowClear
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Select
                        showSearch
                        placeholder="Chọn Phường/Xã (Ward)"
                        value={selectedWardId || undefined}
                        onChange={(v)=>setSelectedWardId(v)}
                        options={(wards || []).map(w=>({ value: w.id, label: w.name }))}
                        disabled={!selectedDistrictId}
                        allowClear
                      />
                    </div>
                    <Input placeholder="Loại hình (ví dụ: Chung cư)" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} />
                    <Select value={form.status} onChange={(v)=>setForm({...form,status:v})} options={[{value:'Upcoming',label:'Sắp mở bán'},{value:'OpenForSale',label:'Đang mở bán'},{value:'Delivered',label:'Đã bàn giao'},{value:'Unverified',label:'Chưa xác thực'}]} />
                  </Space>
                </Card>

                <Card size="small" title="Giá bán">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input placeholder="Giá từ" value={form.priceFrom} onChange={e=>setForm({...form,priceFrom:e.target.value})} />
                    <Input placeholder="Giá đến" value={form.priceTo} onChange={e=>setForm({...form,priceTo:e.target.value})} />
                    <Select placeholder="Đơn vị giá" value={form.priceUnit} onChange={(v)=>setForm({...form,priceUnit:v})} options={[{value:'VND',label:'VND'},{value:'Trieu',label:'Triệu'},{value:'Ty',label:'Tỷ'},{value:'USD',label:'USD'},{value:'USDm2',label:'USD/m²'}]} />
                    <Checkbox checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})}>Đánh dấu nổi bật</Checkbox>
                    <Input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={e=>setForm({...form,thumbnailUrl:e.target.value})} />
                  </Space>
                </Card>
              </div>

              <Divider />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card size="small" title="Thông tin dự án">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input placeholder="Chủ đầu tư (Investor)" value={form.investor} onChange={e=>setForm({...form,investor:e.target.value})} />
                    <Input placeholder="Thiết kế (Designer)" value={form.designer} onChange={e=>setForm({...form,designer:e.target.value})} />
                    <Input placeholder="Quy mô (Scale Summary)" value={form.scaleSummary} onChange={e=>setForm({...form,scaleSummary:e.target.value})} />
                    <Input placeholder="Loại sản phẩm (Product Types)" value={form.productTypes} onChange={e=>setForm({...form,productTypes:e.target.value})} />
                    <Input placeholder="Pháp lý (Legal Status)" value={form.legalStatus} onChange={e=>setForm({...form,legalStatus:e.target.value})} />
                    <Input placeholder="Tiến độ (Timeline)" value={form.timeline} onChange={e=>setForm({...form,timeline:e.target.value})} />
                    <Input placeholder="Video URL (giới thiệu dự án)" value={form.videoUrl} onChange={e=>setForm({...form,videoUrl:e.target.value})} />
                  </Space>
                </Card>

                <Card size="small" title="Mô tả">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input.TextArea placeholder="Mô tả ngắn" value={form.shortDescription} onChange={e=>setForm({...form,shortDescription:e.target.value})} rows={3} />
                    <Input.TextArea placeholder="Nội dung chi tiết (có thể HTML)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={8} />
                  </Space>
                </Card>
              </div>

              <Divider />

              <Card size="small" title="Thư viện ảnh">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(form.images || []).map((img, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 100px', gap: 8, alignItems: 'center' }}>
                      <Input placeholder="Image URL" value={img.url} onChange={e=>{
                        const images = [...(form.images||[])];
                        images[idx] = { ...images[idx], url: e.target.value };
                        setForm({ ...form, images });
                      }} />
                      <Input placeholder="Caption" value={img.caption || ''} onChange={e=>{
                        const images = [...(form.images||[])];
                        images[idx] = { ...images[idx], caption: e.target.value };
                        setForm({ ...form, images });
                      }} />
                      <Space>
                        <Button size="small" onClick={()=>{
                          if (idx === 0) return;
                          const images = [...(form.images||[])];
                          const tmp = images[idx-1]; images[idx-1] = images[idx]; images[idx] = tmp;
                          setForm({ ...form, images });
                        }}>Up</Button>
                        <Button size="small" onClick={()=>{
                          const images = (form.images||[]).filter((_,i)=>i!==idx);
                          setForm({ ...form, images });
                        }} danger>Remove</Button>
                      </Space>
                    </div>
                  ))}
                  <Button onClick={()=> setForm({ ...form, images: [...(form.images||[]), { url: '', caption: '', order: (form.images?.length||0) }] })}>Thêm ảnh</Button>
                </Space>
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
                { title: 'Tên', dataIndex: 'name' },
                { title: 'Slug', dataIndex: 'slug' },
                { title: 'Vị trí', dataIndex: 'location' },
                { title: 'Nổi bật', dataIndex: 'isFeatured', render: v => v ? '✓' : '' },
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

export default ProjectsAdminPage;


