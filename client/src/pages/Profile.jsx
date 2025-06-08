import React, { useState, useEffect } from 'react';
import { userService } from '../api/userService.js';
import './Profile.css';
import { FaPen } from 'react-icons/fa';
import { useAuth } from '../auth/AuthContext';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let avatarUrl = user?.avatarUrl;
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        const res = await userService.uploadAvatar(formData);
        avatarUrl = res.avatarUrl;
      }
      await userService.updateProfile({ ...form, avatarUrl });
      setSuccess('Cập nhật thành công!');
      setUser(prev => ({ ...prev, ...form, avatarUrl }));
    } catch (err) {
      setError('Cập nhật thất bại!');
    }
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">Hồ sơ cá nhân</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="profile-content">
          {/* Avatar bên trái */}
          <div className="profile-avatar-wrapper" onClick={() => document.getElementById('avatarInput').click()}>
  <img
    src={avatarPreview || '/default-avatar.png'}
    alt="Avatar"
    className="profile-avatar"
  />
  <div className="avatar-overlay">
    <span className="edit-icon"><FaPen /></span>
  </div>
  <input
    type="file"
    id="avatarInput"
    accept="image/*"
    style={{ display: 'none' }}
    onChange={handleAvatarChange}
  />
</div>

          {/* Thông tin bên phải */}
          <div className="profile-info-section">
            <div className="form-group">
              <label>Họ tên</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
