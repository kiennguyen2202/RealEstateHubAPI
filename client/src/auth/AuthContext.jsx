// src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';
//import axiosPrivate from '../api/axiosPrivate'; 


import axiosPrivate from '../api/axiosPrivate';
import { toast } from 'react-hot-toast';

// Tạo và export AuthContext
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra token trong localStorage khi component mount
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosPrivate.get('/api/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosPrivate.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      // Nếu đăng nhập thất bại, server có thể trả về một chuỗi hoặc một đối tượng có trường message
      const errorMessage = response.data?.message || response.data;
      return { success: false, error: errorMessage };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data || "Đăng nhập thất bại";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Register data being sent:', userData);
      const response = await axiosPrivate.post('/api/auth/register', userData);
      console.log('Register response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          setUser(response.data.user);
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Không nhận được token từ server'
        };
      }
    } catch (error) {
      console.error('Register error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data || 
                          'Đăng ký thất bại';
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      console.log('Updating profile...');
      const response = await axiosPrivate.put('/api/users/profile', userData);
      console.log('Profile update response:', response.data);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Cập nhật thông tin thất bại'
      };
    }
  };

  const showNotification = (message, type = 'error') => {
    const baseOptions = {
      duration: 5000,
      position: 'top-right',
      style: {
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };

    if (type === 'error') {
      toast.error(message, {
        ...baseOptions,
        style: {
          ...baseOptions.style,
          background: '#fee',
          color: '#c00',
        }
      });
    } else if (type === 'warning') {
      toast(message, {
        ...baseOptions,
        icon: '⚠️',
        style: {
          ...baseOptions.style,
          background: '#fff3cd',
          color: '#856404',
        }
      });
    } else {
      toast.success(message, {
        ...baseOptions,
        style: {
          ...baseOptions.style,
          background: '#e8f5e9',
          color: '#2e7d32',
        }
      });
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    showNotification
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
