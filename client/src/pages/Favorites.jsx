import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import axiosClient from '../api/axiosClient';
import PropertyCard from '../components/property/PropertyCard';
import './Favorites.css';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const response = await axiosClient.get('/api/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="favorites-container">
                <h2>Vui lòng đăng nhập để xem danh sách yêu thích</h2>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="favorites-container">
                <h2>Đang tải...</h2>
            </div>
        );
    }

    return (
        <div className="favorites-container">
            <h2>Danh sách yêu thích</h2>
            {favorites.length === 0 ? (
                <p>Bạn chưa có bài đăng nào trong danh sách yêu thích</p>
            ) : (
                <div className="favorites-grid">
                    {favorites.map((favorite) => (
                        <PropertyCard
                            key={favorite.id}
                            property={favorite.post}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites; 