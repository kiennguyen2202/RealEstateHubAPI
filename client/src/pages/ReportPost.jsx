import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosPrivate from "../api/axiosPrivate";
import { useAuth } from "../auth/AuthContext";
import './ReportPost.css';

function ReportPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    reason: "",
    description: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await axiosPrivate.get(`/api/posts/${id}`);
        setPost(response.data);
      } catch (err) {
        setError("Không thể tải thông tin bài viết");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason) {
      alert("Vui lòng chọn lý do báo cáo");
      return;
    }

    const typeMap = {
      'LuaDao': 0,
      'TrungLap': 1,
      'DaBan': 2,
      'KhongLienLacDuoc': 3,
      'ThongTinSaiBatDongSan': 4,
      'ThongTinSaiNguoiDang': 5,
      'Other': 6
    };

    const requestBody = {
      userId: user?.id,
      postId: post?.id,
      type: typeMap[formData.reason],
      other: formData.description,
      phone: user?.phone || ""
    };

    try {
      await axiosPrivate.post(`/api/reports`, requestBody); 
      alert("Báo cáo đã được gửi thành công");
      navigate(`/chi-tiet/${id}`);
    } catch (err) {
      console.error(err);
      alert("Không thể gửi báo cáo");
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!post) return <div className="text-center p-4">Không tìm thấy bài viết</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Báo cáo bài viết</h1>

          {/* Thông tin bài viết */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600 text-sm mb-2">{post.description}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{post.area_Size} m²</span>
              <span>{post.area?.ward}, {post.area?.district}</span>
            </div>
          </div>

          {/* Form báo cáo */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do báo cáo
              </label>
              <select
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Chọn lý do</option>
                <option value="LuaDao">Lừa đảo</option>
                <option value="TrungLap">Bài viết trùng lặp</option>
                <option value="DaBan">Đã bán</option>
                <option value="KhongLienLacDuoc">Không liên lạc được</option>
                <option value="ThongTinSaiBatDongSan">Thông tin sai bất động sản</option>
                <option value="ThongTinSaiNguoiDang">Thông tin sai người đăng</option>
                <option value="Other">Lý do khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="4"
                placeholder="Vui lòng cung cấp thêm thông tin chi tiết về lý do báo cáo..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                Gửi báo cáo
              </button>
              <button
                type="button"
                onClick={() => navigate(`/posts/${id}`)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportPost;
