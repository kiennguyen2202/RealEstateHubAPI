import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../auth/AuthContext';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './FavoriteButton.css';

const FavoriteButton = ({ postId }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        checkFavoriteStatus();
    }, [user, postId]);

    const checkFavoriteStatus = async () => {
        try {
            const response = await axiosClient.get(`/api/favorites/check/${postId}`);
            setIsFavorite(response.data.isFavorite);
        } catch (error) {
            console.error('Error checking favorite status:', error);
            setIsFavorite(false);
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            toast.warning('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
            return;
        }

        setIsLoading(true);
        try {
            if (isFavorite) {
                await axiosClient.delete(`/api/favorites/user/${user.id}/post/${postId}`);
                toast.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                await axiosClient.post(`/api/favorites/${user.id}/${postId}`);
                toast.success('Đã thêm vào danh sách yêu thích');
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(error.response?.data || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            className={`favorite-button ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            disabled={isLoading}
        >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
    );
};

export default FavoriteButton; 