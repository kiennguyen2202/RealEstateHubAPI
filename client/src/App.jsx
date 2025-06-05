import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";

import Home from "./pages/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import ReportPost from "./pages/ReportPost";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import AdminRoute from "./auth/AdminRoute";
import MessagingFeature from './components/Message/MessagingFeature';
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
              
              <Route path="/chi-tiet/:id" element={<PostDetail />} />
              {/* Các routes cũ */}
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dang-tin" element={<CreatePostPage />} />
                <Route path="/messages" element={<MessagingFeature />} />
                <Route path="/chi-tiet/:id/report" element={<ReportPost />} />
                <Route path="/profile" element={<Profile />} />
                
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
