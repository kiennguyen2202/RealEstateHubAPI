import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import axiosPrivate from '../api/axiosPrivate';
import PropertyCard from '../components/property/PropertyCard';

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
            const response = await axiosPrivate.get(`/api/favorites/user/${user.id}`);
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-6xl mx-auto mt-32">
                <h2>Vui lòng đăng nhập để xem danh sách yêu thích</h2>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto mt-32">
                <div>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pt-32">
            <h2 className="text-2xl font-bold mb-4" >Danh sách yêu thích</h2>
            {favorites.length === 0 ? (
                <div>Bạn chưa có bài đăng nào trong danh sách yêu thích.</div>
            ) : (
                <div className="properties-grid">
                    {favorites.map((favorite) => (
                        <PropertyCard
                            key={favorite.id}
                            property={favorite.post}
                            showFavorite={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites; 