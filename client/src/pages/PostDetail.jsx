import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosPrivate from "../api/axiosPrivate";
import { useAuth } from "../auth/AuthContext";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(location.search.includes('edit=true'));
  const [editForm, setEditForm] = useState({
    Title: "",
    Description: "",
    Price: "",
    Status: "",
    AreaSize: "",
    StreetName: "",
    CategoryId: "",
    AreaId: ""
  });
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axiosPrivate.get(`/api/posts/${id}`);
        setPost(response.data);
        setEditForm({
          Title: response.data.title,
          Description: response.data.description,
          Price: response.data.price,
          Status: response.data.status,
          AreaSize: response.data.area_Size,
          StreetName: response.data.street_Name,
          CategoryId: response.data.categoryId,
          AreaId: response.data.areaId
        });
      } catch (err) {
        setError("Không thể tải thông tin bài viết");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        const [categoriesRes, areasRes] = await Promise.all([
          axiosPrivate.get("/api/categories"),
          axiosPrivate.get("/api/areas")
        ]);
        setCategories(categoriesRes.data);
        setAreas(areasRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchPost();
    fetchData();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosPrivate.put(`/api/posts/${id}`, editForm);
      setPost(response.data);
      setIsEditing(false);
      alert("Cập nhật bài viết thành công!");
    } catch (err) {
      setError("Không thể cập nhật bài viết");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosPrivate.delete(`/api/posts/${id}`);
        alert("Xóa bài viết thành công!");
        navigate("/");
      } catch (err) {
        setError("Không thể xóa bài viết");
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!post) return <div className="text-center p-4">Không tìm thấy bài viết</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            <input
              type="text"
              value={editForm.Title}
              onChange={(e) => setEditForm({ ...editForm, Title: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tiêu đề"
              required
            />
            <textarea
              value={editForm.Description}
              onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Mô tả"
              required
            />
            <input
              type="number"
              value={editForm.Price}
              onChange={(e) => setEditForm({ ...editForm, Price: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Giá"
              required
            />
            <input
              type="text"
              value={editForm.Status}
              onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Trạng thái"
              required
            />
            <input
              type="number"
              value={editForm.AreaSize}
              onChange={(e) => setEditForm({ ...editForm, AreaSize: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Diện tích"
              required
            />
            <input
              type="text"
              value={editForm.StreetName}
              onChange={(e) => setEditForm({ ...editForm, StreetName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên đường"
              required
            />
            <select
              value={editForm.CategoryId}
              onChange={(e) => setEditForm({ ...editForm, CategoryId: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Chọn loại bất động sản</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={editForm.AreaId}
              onChange={(e) => setEditForm({ ...editForm, AreaId: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Chọn khu vực</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.city} - {area.district} - {area.ward}
                </option>
              ))}
            </select>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
              <p className="text-gray-600 mb-4">{post.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Giá: {post.price} VNĐ</p>
                  <p className="font-semibold">Trạng thái: {post.status}</p>
                  <p className="font-semibold">Diện tích: {post.area_Size} m²</p>
                  <p className="font-semibold">Địa chỉ: {post.street_Name}</p>
                </div>
                <div>
                  <p className="font-semibold">Khu vực: {post.area?.city} - {post.area?.district} - {post.area?.ward}</p>
                  <p className="font-semibold">Loại: {post.category?.name}</p>
                  <p className="font-semibold">Ngày đăng: {new Date(post.created).toLocaleDateString()}</p>
                  <p className="font-semibold">Người đăng: {post.user?.name}</p>
                </div>
              </div>
            </div>

            {post.images && post.images.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Hình ảnh</h2>
                <div className="grid grid-cols-3 gap-4">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`Hình ảnh ${index + 1}`}
                      className="w-full h-48 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            {user && (user.id === post.userId || user.role === "Admin") && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Xóa
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PostDetail; 