import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosPrivate from "../api/axiosPrivate";
import { useAuth } from "../auth/AuthContext";

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalReports: 0,
    pendingApprovals: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Kiểm tra quyền Admin
    if (!user || user.role !== "Admin") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, postsRes, usersRes, reportsRes] = await Promise.all([
          axiosPrivate.get("/api/admin/stats"),
          axiosPrivate.get("/api/admin/recent-posts"),
          axiosPrivate.get("/api/admin/recent-users"),
          axiosPrivate.get("/api/admin/reports")
        ]);

        setStats(statsRes.data);
        setRecentPosts(postsRes.data);
        setRecentUsers(usersRes.data);
        setReports(reportsRes.data);
      } catch (err) {
        setError("Không thể tải dữ liệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleApprovePost = async (postId) => {
    try {
      await axiosPrivate.put(`/api/admin/posts/${postId}/approve`);
      setRecentPosts(posts => posts.map(post => 
        post.id === postId ? { ...post, status: "approved" } : post
      ));
    } catch (err) {
      console.error(err);
      alert("Không thể phê duyệt bài viết");
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      await axiosPrivate.put(`/api/admin/posts/${postId}/reject`);
      setRecentPosts(posts => posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error(err);
      alert("Không thể từ chối bài viết");
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await axiosPrivate.put(`/api/admin/reports/${reportId}/resolve`);
      setReports(reports => reports.filter(report => report.id !== reportId));
    } catch (err) {
      console.error(err);
      alert("Không thể xử lý báo cáo");
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Bảng điều khiển Admin</h1>

        {/* Thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Tổng số bài viết</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPosts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Tổng số người dùng</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Báo cáo chờ xử lý</h3>
            <p className="text-3xl font-bold text-red-600">{stats.totalReports}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Bài viết chờ duyệt</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
          </div>
        </div>

        {/* Bài viết gần đây */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Bài viết gần đây</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người đăng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentPosts.map(post => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">{post.title}</td>
                      <td className="px-6 py-4">{post.user?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          post.status === "approved" ? "bg-green-100 text-green-800" :
                          post.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {post.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprovePost(post.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleRejectPost(post.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Báo cáo */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Báo cáo gần đây</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài viết</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người báo cáo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td className="px-6 py-4">{report.post?.title}</td>
                      <td className="px-6 py-4">{report.reporter?.name}</td>
                      <td className="px-6 py-4">{report.reason}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Đã xử lý
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 