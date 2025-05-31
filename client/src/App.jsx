// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import Home from "./pages/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Search from "./pages/Search";
import Messages from "./pages/Messages";
import ReportPost from "./pages/ReportPost";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import AdminRoute from "./auth/AdminRoute";
import "./App.css";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Trang chủ mới */}
              <Route path="/" element={<HomePage />} />
              
              {/* Trang chi tiết bất động sản mới */}
              <Route path="/chi-tiet/:id" element={<PropertyDetailPage />} />
              
              {/* Các routes cũ */}
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<Search />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dang-tin" element={<CreatePostPage />} />
                <Route path="/posts/:id" element={<PostDetail />} />
                <Route path="/posts/:id/report" element={<ReportPost />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
