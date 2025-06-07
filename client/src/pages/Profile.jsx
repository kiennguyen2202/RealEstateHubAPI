import React, { useState, useEffect } from 'react';
import { userService } from '../api/userService.js';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Lấy thông tin user khi vào trang
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data);
        setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
        setAvatarPreview("http://localhost:5134/" + data.avatarUrl || '');
      } catch (err) {
        setError('Không thể tải thông tin người dùng');
      }
    };
    fetchUser();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Xử lý chọn ảnh avatar mới
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Xử lý submit cập nhật thông tin
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Nếu có avatar mới, upload trước
      let avatarUrl = user?.avatarUrl;
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        
       
        const res = await userService.uploadAvatar(formData);
        avatarUrl = res.avatarUrl;
      }
      // Cập nhật thông tin user
      await userService.updateProfile({ ...form, avatarUrl });
      setSuccess('Cập nhật thành công!');
      setUser(prev => ({ ...prev, ...form, avatarUrl }));
    } catch (err) {
      setError('Cập nhật thất bại!');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Hồ sơ cá nhân</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center mb-4">
          <img
            src={avatarPreview || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover mb-2 border"
          />
          <label className="cursor-pointer text-blue-600 hover:underline">
            Đổi ảnh đại diện
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Họ tên</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold mt-2"
          disabled={loading}
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật'}
        </button>
      </form>
    </div>
  );
};

export default Profile;