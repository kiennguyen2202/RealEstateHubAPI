import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";

import Home from "./pages/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import MessagingFeature from './components/Message/MessagingFeature';
import PostHistory from './pages/PostHistory';
import ReportPost from "./pages/ReportPost";
import Favorites from "./pages/Favorites";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import AdminRoute from "./auth/AdminRoute";
import UsersPage from './pages/UsersPage';
import PostsPage from './pages/PostsPage';
import ReportsPage from './pages/ReportsPage';
import CategoriesPage from './pages/CategoriesPage';
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
                <Route path="/post-history" element={<PostHistory />} />
                <Route path="/favorites" element={<Favorites />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/posts" element={<PostsPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/categories" element={<CategoriesPage />} />
              </Route>
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
