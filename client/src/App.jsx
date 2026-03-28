import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import MembershipPage from "./pages/Membership/MembershipPage";
import Home from "./pages/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";

import PostDetail from "./pages/Post/PostDetail";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import StreamChatPage from './pages/Chat/StreamChatPage';

import PostHistory from './pages/Post/PostHistory';
import ReportPost from "./pages/ReportPost";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import AdminRoute from "./auth/AdminRoute";
import UsersPage from './pages/Admin/UsersPage';
import PostsPage from './pages/Admin/PostsPage';
import ReportsPage from './pages/Admin/ReportsPage';
import CategoriesPage from './pages/Admin/CategoriesPage';
import AreaPage from './pages/Admin/AreaPage';
import MembershipCheckoutPage from './pages/Checkout/MembershipCheckoutPage';
import PaymentCallbackVnpay from './pages/Checkout/PaymentCallbackVnpay';
import ScrollToTop from './components/layout/ScrollToTop';
import Membership from "./pages/Membership/Membership";
import CreatePostWizard from "./pages/Post/CreatePostWizard";

import PostListPage from "./pages/Post/PostListPage";
import AgentPage from "./pages/Agent/AgentPage";

import RegisterAgentPage from "./pages/Agent/RegisterAgentPage";
import AgentProfilePage from "./pages/Agent/AgentProfilePage";
import AgentListPage from "./pages/Agent/AgentListPage";
// import EditAgentProfilePage from "./pages/Agent/EditAgentProfilePage";
import AgentProfileOverviewPage from './pages/Agent/AgentProfileOverviewPage';
import AgentProfileCheckoutPage from './pages/Checkout/AgentProfileCheckoutPage';
import PaymentCallbackPayOS from './pages/Checkout/PaymentCallbackPayOS';
import { useMessageNotifications } from './hooks/useMessageNotifications';
import "./App.css";

import ProjectsList from "./pages/Projects/ProjectsList";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import NewsList from "./pages/News/NewsList";
import ArticleDetail from "./pages/News/ArticleDetail";
import ProjectsAdminPage from "./pages/Admin/ProjectsAdminPage";
import ArticlesAdminPage from "./pages/Admin/ArticlesAdminPage";
import UserPostsPage from "./pages/User/UserPostsPage";
import UserDashboard from "./pages/UserDashboard/UserDashboard";

// Component để khởi tạo message notifications
const MessageNotificationProvider = ({ children }) => {
  const { user } = useAuth();
  useMessageNotifications(user);
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <MessageNotificationProvider>
          <ScrollToTop />
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
              {/* Trang chủ mới */}
              <Route path="/" element={<HomePage />} />
              
              {/* Trang danh sách bài viết */}
              <Route path="/posts" element={<PostListPage />} />
              <Route path="/Sale" element={<PostListPage />} />
              <Route path="/Rent" element={<PostListPage />} />
              {/* Projects & News */}
              <Route path="/du-an" element={<ProjectsList />} />
              <Route path="/du-an/:slug" element={<ProjectDetail />} />
              <Route path="/tin-tuc" element={<NewsList />} />
              <Route path="/tin-tuc/:slug" element={<ArticleDetail />} />
              
              <Route path="/chi-tiet/:id" element={<PostDetail />} />
              <Route path="/user/:userId/posts" element={<UserPostsPage />} />
              {/* Các routes cũ */}
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              
              
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dang-tin" element={<CreatePostWizard />} />
                <Route path="/chat" element={<StreamChatPage />} />
                
                <Route path="/chi-tiet/:id/report" element={<ReportPost />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/agent" element={<AgentPage />} />
                
              
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/post-history" element={<PostHistory />} />
                <Route path="/membership-checkout" element={<MembershipCheckoutPage />} />
                <Route path="/agent-checkout" element={<AgentProfileCheckoutPage />} />
                <Route path="/Checkout/PaymentCallbackVnpay" element={<PaymentCallbackVnpay />} />
                <Route path="/checkout/payos-return" element={<PaymentCallbackPayOS />} />
                <Route path="/checkout/payos-cancel" element={<PaymentCallbackPayOS />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/posts" element={<PostsPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/areas" element={<AreaPage/>}/>
                <Route path="/admin/categories" element={<CategoriesPage />} />
                <Route path="/admin/membership" element={<Membership />} />
                <Route path="/admin/projects" element={<ProjectsAdminPage />} />
                <Route path="/admin/articles" element={<ArticlesAdminPage />} />
              </Route>

              {/* Agent Profile Routes */}
              <Route path="/agent-profile" element={<AgentListPage />} />
              <Route path="/agent-profile/preview" element={<RegisterAgentPage />} />
              <Route path="/agent-profile/:id" element={<AgentProfilePage />} />
              {/* <Route path="/agent-profile/:id/edit" element={<EditAgentProfilePage />} /> */}
              <Route path="/agent-profile/preview/:id" element={<AgentProfileOverviewPage />} />
              {/* <Route path="/agent-profile/overview/preview/:id" element={<AgentProfileOverviewPage />} /> */}
            </Routes>
          </main>
          <Footer />
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
          />
        </div>
        </MessageNotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
