// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { getAgentProfileById } from '../../services/agentProfileService';

// export default function EditAgentProfilePage() {
//   const { id } = useParams();
//   const [form, setForm] = useState(null);
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     getAgentProfileById(id).then(setForm);
//   }, [id]);

//   if (!form) return <div>Đang tải...</div>;

//   const handleChange = e => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     try {
//       await updateAgentProfile(id, form);
//       setMessage('Cập nhật thành công!');
//     } catch {
//       setMessage('Có lỗi xảy ra!');
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Chỉnh sửa hồ sơ Agent</h2>
//       <form onSubmit={handleSubmit} className="space-y-3">
//         <input name="shopName" placeholder="Tên shop" value={form.shopName} onChange={handleChange} className="input" required />
//         <input name="slug" placeholder="Slug (đường dẫn)" value={form.slug} onChange={handleChange} className="input" required />
//         <input name="avatarUrl" placeholder="Avatar URL" value={form.avatarUrl} onChange={handleChange} className="input" />
//         <input name="bannerUrl" placeholder="Banner URL" value={form.bannerUrl} onChange={handleChange} className="input" />
//         <input name="address" placeholder="Địa chỉ" value={form.address} onChange={handleChange} className="input" />
//         <input name="areaId" placeholder="Area ID" value={form.areaId} onChange={handleChange} className="input" />
//         <input name="categoryId" placeholder="Category ID" value={form.categoryId} onChange={handleChange} className="input" />
//         <input name="transactionType" placeholder="Loại hình (0: Bán, 1: Thuê)" value={form.transactionType} onChange={handleChange} className="input" />
//         <input name="phoneNumber" placeholder="Số điện thoại" value={form.phoneNumber} onChange={handleChange} className="input" />
//         <textarea name="description" placeholder="Mô tả" value={form.description} onChange={handleChange} className="input" />
//         <button type="submit" className="btn btn-primary">Cập nhật</button>
//       </form>
//       {message && <div className="mt-2 text-green-600">{message}</div>}
//     </div>
//   );
// } 