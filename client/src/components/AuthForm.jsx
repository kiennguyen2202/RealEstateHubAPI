import { useState } from "react";
import axios from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isLogin ? "/auth/login" : "/auth/register";
      const res = await axios.post(url, formData);
      if (isLogin) {
        login(res.data.token);
        navigate("/posts"); // chuyển hướng sau khi login
      } else {
        alert("Đăng ký thành công, vui lòng đăng nhập.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Lỗi: " + err.response?.data || "Không thể kết nối.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? "Đăng nhập" : "Đăng ký"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>
      <p className="text-center mt-4">
        {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
        <button
          className="ml-2 text-blue-600 underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Đăng ký" : "Đăng nhập"}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;
