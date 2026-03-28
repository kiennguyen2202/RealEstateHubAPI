import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  FaHome, FaRuler, FaMapMarkerAlt, FaUser,
  FaPhone, FaEnvelope, FaEdit, FaTrash, FaExclamationTriangle,
  FaCommentDots, FaCrown, FaBed, FaBath, FaBuilding, FaRoad, FaMoneyBillWave, FaCompass, FaLocationArrow, FaFileAlt, FaWarehouse
} from "react-icons/fa";
import "./PostDetail.css";
import { PriceUnit, formatPrice } from '../../utils/priceUtils.js';
import { isProRole } from '../../utils/roleUtils.js';
import ReportPost from "../ReportPost.jsx";
import MapComponent from "../../components/MapComponent.jsx";
import PriceChart from "../../components/PriceChart/PriceChart.jsx";
import MortgageCalculator from "../../components/MortgageCalculator/MortgageCalculator.jsx";


import CustomImageTourViewer from "../../components/CustomImageTourViewer.jsx";
import StreetViewComponent from "../../components/StreetViewComponent.jsx";
import axiosPrivate from "../../api/axiosPrivate.js";


const TransactionType = {
  Sale: 0,
  Rent: 1
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [fullAddressForMap, setFullAddressForMap] = useState('');
  const [mapModalZoomLevel, setMapModalZoomLevel] = useState(5);
  const [showFullscreenStreetView, setShowFullscreenStreetView] = useState(false);
  const [newImages, setNewImages] = useState(null);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    priceUnit: "",
    area_Size: "",
    street_Name: "",
    address: "",
    categoryId: "",
    areaId: "",
    transactionType: "",
    status: "",
    city: "",
    district: "",
    ward: "",
    soPhongNgu: '',
    soPhongTam: '',
    soTang: '',
    huongNha: '',
    huongBanCong: '',
    matTien: '',
    duongVao: '',
    phapLy: '',

  });
  const [categories, setCategories] = useState([]);
  const [showPanorama, setShowPanorama] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('photo');
  const [showFullscreen3D, setShowFullscreen3D] = useState(false);

  // Helpers to mask contact info when viewer is not authenticated
  const maskPhone = (phone) => {
    if (!phone) return "";
    const digits = String(phone).replace(/\s+/g, '');
    // Show first 6 digits then space and *** (matches screenshot idea like "036868 ***")
    if (digits.length <= 3) return `${digits} ***`;
    const visible = digits.slice(0, Math.min(6, digits.length));
    return `${visible} ***`;
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const parts = String(email).split("@");
    if (parts.length < 2) return "*".repeat(String(email).length);
    const [local, domain] = parts;
    const visible = local.slice(0, 2);
    const maskedLocal = `${visible}${"*".repeat(Math.max(0, local.length - 2))}`;
    return `${maskedLocal}@${domain}`;
  };

  const [showLoginTooltip, setShowLoginTooltip] = useState(false);

  const getMapZoomForDetail = (postData) => {
    const minZoom = 5;
    if (postData.street_Name) return minZoom + 13;
    if (postData.area?.ward?.name) return minZoom + 12;
    if (postData.area?.district?.name) return minZoom + 10;
    if (postData.area?.city?.name) return minZoom + 8;
    return minZoom;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await axiosClient.get('/api/categories');
        setCategories(categoriesRes.data);
        const citiesRes = await axiosPrivate.get('/api/areas/cities');
        setUniqueCities(citiesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axiosClient.get(`/api/posts/${id}`);
        console.log('Fetched post data:', response.data);
        console.log('Post Area data:', response.data.area);
        setPost(response.data);
        setEditForm({
          title: response.data.title,
          description: response.data.description,
          price: response.data.price,
          priceUnit: response.data.priceUnit,
          area_Size: response.data.area_Size,
          street_Name: response.data.street_Name,
          address: response.data.address,
          categoryId: response.data.categoryId,
          areaId: response.data.areaId,
          transactionType: response.data.transactionType,
          status: response.data.status,
          city: response.data.area?.cityId || '',
          district: response.data.area?.districtId || '',
          ward: response.data.area?.id || '',
          soPhongNgu: response.data.soPhongNgu || '',
          soPhongTam: response.data.soPhongTam || '',
          soTang: response.data.soTang || '',
          huongNha: response.data.huongNha || '',
          huongBanCong: response.data.huongBanCong || '',
          matTien: response.data.matTien || '',
          duongVao: response.data.duongVao || '',
          phapLy: response.data.phapLy || '',

        });
        const addressParts = [];
        // Ưu tiên địa chỉ mới
        if (response.data.wardName) addressParts.push(response.data.wardName);
        else if (response.data.area?.ward?.name) addressParts.push(response.data.area.ward.name);
        
        if (response.data.districtName) addressParts.push(response.data.districtName);
        else if (response.data.area?.district?.name) addressParts.push(response.data.area.district.name);
        
        if (response.data.cityName) addressParts.push(response.data.cityName);
        else if (response.data.area?.city?.name) addressParts.push(response.data.area.city.name);
        
        setFullAddressForMap(addressParts.join(', '));
        const newMapModalZoom = getMapZoomForDetail(response.data);
        setMapModalZoomLevel(newMapModalZoom);
        
        // Fetch related posts (cùng category hoặc cùng khu vực)
        try {
          const relatedRes = await axiosClient.get('/api/posts', {
            params: { isApproved: true }
          });
          const allPosts = relatedRes.data || [];
          // Lọc bài liên quan: cùng category hoặc cùng thành phố, loại trừ bài hiện tại
          const related = allPosts.filter(p => {
            if (p.id === parseInt(id)) return false;
            const sameCategory = p.categoryId === response.data.categoryId;
            const sameCity = (p.cityName && response.data.cityName && p.cityName === response.data.cityName) ||
                            (p.area?.city?.name && response.data.area?.city?.name && p.area.city.name === response.data.area.city.name);
            return sameCategory || sameCity;
          }).slice(0, 6); // Lấy tối đa 6 bài
          setRelatedPosts(related);
        } catch (relatedErr) {
          console.error('Error fetching related posts:', relatedErr);
        }
      } catch (err) {
        setError("Không thể tải thông tin bài viết");
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Add new useEffect to reset scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Open 3D tab if URL hash is #view3d
  useEffect(() => {
    if (window.location.hash === '#view3d') {
      setActiveMediaTab('3d');
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setIsEditing(searchParams.get("edit") === "true");
  }, [location]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (editForm.city) {
        try {
          const response = await axiosPrivate.get(`/api/areas/cities/${editForm.city}/districts`);
          setFilteredDistricts(response.data);
        } catch (err) {
          console.error('Error fetching districts for edit form:', err);
        }
      } else {
        setFilteredDistricts([]);
      }
    };

    fetchDistricts();
  }, [editForm.city]);

  useEffect(() => {
    const fetchWards = async () => {
      if (editForm.district) {
        try {
          const response = await axiosPrivate.get(`/api/areas/districts/${editForm.district}/wards`);
          setFilteredWards(response.data);
        } catch (err) {
          console.error('Error fetching wards for edit form:', err);
        }
      } else {
        setFilteredWards([]);
      }
    };

    fetchWards();
  }, [editForm.district]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form data before submit:', editForm);

      const postData = new FormData();
      postData.append('Id', parseInt(id));
      postData.append('Title', editForm.title);
      postData.append('Description', editForm.description);
      postData.append('Price', parseFloat(editForm.price));
      postData.append('PriceUnit', parseInt(editForm.priceUnit));
      postData.append('Street_Name', editForm.street_Name);
      postData.append('Area_Size', parseFloat(editForm.area_Size));
      postData.append('CategoryId', parseInt(editForm.categoryId));
      postData.append('AreaId', parseInt(editForm.ward));
      postData.append('TransactionType', parseInt(editForm.transactionType));
      postData.append('UserId', post.userId);
      postData.append('Status', 'active');
      postData.append('SoPhongNgu', editForm.soPhongNgu);
      postData.append('SoPhongTam', editForm.soPhongTam);
      postData.append('SoTang', editForm.soTang);
      postData.append('HuongNha', editForm.huongNha);
      postData.append('HuongBanCong', editForm.huongBanCong);
      postData.append('MatTien', editForm.matTien);
      postData.append('DuongVao', editForm.duongVao);
      postData.append('PhapLy', editForm.phapLy);

      if (newImages) {
        Array.from(newImages).forEach(image => {
          postData.append('Images', image);
        });
      }


      console.log('Data being sent to server:', postData);

      const response = await axiosClient.put(`/api/posts/${id}`, postData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Server response:', response.data);

      const updatedPost = await axiosClient.get(`/api/posts/${id}`);
      setPost(updatedPost.data);
      setIsEditing(false);
      navigate(`/chi-tiet/${id}`);
    } catch (err) {
      console.error('Error updating post:', err);
      if (err.response) {
        console.error('Error details:', err.response.data);
        alert(err.response.data.message || "Không thể cập nhật bài viết");
      } else {
        alert("Không thể cập nhật bài viết");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosClient.delete(`/api/posts/${id}`);
        navigate("/");
      } catch (err) {
        console.error(err);
        alert("Không thể xóa bài viết");
      }
    }
  };

  const handleAddressClick = () => {
    setShowMapModal(true);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <FaExclamationTriangle className="mr-2" />
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-message">
        <FaExclamationTriangle className="mr-2" />
        Không tìm thấy bài viết
      </div>
    );
  }

  // Tính đơn giá theo m²
  const getPricePerSquareMeter = () => {
    if (!post?.price || !post?.area_Size) return null;

    // Tính giá theo triệu
    let totalPriceInMillions = post.price;

    if (post.priceUnit === PriceUnit.Tỷ) {
      totalPriceInMillions = post.price * 1000;
    }

    const unitPriceInMillions = totalPriceInMillions / post.area_Size;

    return `~${unitPriceInMillions.toFixed(1)} triệu/m²`;
  };


  return (
    <div className="post-detail">
      {/* Header */}
      <div className="post-header">
        <div className="post-content">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <div className="post-meta-item clickable-address" onClick={handleAddressClick}>
              <FaMapMarkerAlt />
              <span>
                {post.street_Name}
                {post.wardName && `, ${post.wardName}`}
                {post.districtName && `, ${post.districtName}`}
                {post.cityName && `, ${post.cityName}`}
                {/* Fallback cho dữ liệu cũ */}
                {!post.wardName && post.area?.ward?.name && `, ${post.area.ward.name}`}
                {!post.districtName && post.area?.district?.name && `, ${post.area.district.name}`}
                {!post.cityName && post.area?.city?.name && `, ${post.area.city.name}`}
              </span>
            </div>
            <div className="post-meta-item">
              <FaRuler />
              <span>{post.area_Size} m²</span>
            </div>
            <div className="post-meta-item">
              <FaHome />
              <span>{post.category?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="post-content">
        <div className="post-grid">
          {/* Left Column - Images and Info */}
          <div className="post-left-column">
            <div className="post-images" style={{ position: 'relative' }}>
              {/* Pro Badge - only show on Photo tab */}
              {activeMediaTab === 'photo' && isProRole(post?.user?.role) && (
                <div className="pro-badge">
                  <FaCrown className="pro-crown-icon" />
                  Pro
                </div>
              )}
              {/* Media Tabs */}
              <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 12,
                padding: '12px 16px',
                background: '#fff',
                borderRadius: '8px 8px 0 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photo')}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    background: activeMediaTab === 'photo' ? '#3b82f6' : '#fff',
                    color: activeMediaTab === 'photo' ? '#fff' : '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Photo
                </button>
                {(post.panoramaTour || post.panoramaTourConfig) && (
                  <button
                    type="button"
                    onClick={() => {
                      // Kiểm tra có panorama images không
                      const hasPanorama = (post.panoramaTour || post.panoramaTourConfig);
                      if (hasPanorama) {
                        setShowFullscreen3D(true);
                      } else {
                        setActiveMediaTab('3d');
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #e5e7eb',
                      background: activeMediaTab === '3d' ? '#3b82f6' : '#fff',
                      color: activeMediaTab === '3d' ? '#fff' : '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    3D view
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Kiểm tra có địa chỉ không
                    const hasAddress = fullAddressForMap || post?.address || (post?.lat && post?.lng);
                    if (hasAddress) {
                      setShowFullscreenStreetView(true);
                    } else {
                      setActiveMediaTab('street');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    background: activeMediaTab === 'street' ? '#3b82f6' : '#fff',
                    color: activeMediaTab === 'street' ? '#fff' : '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Street view
                </button>
              </div>
              {activeMediaTab === 'photo' && (
                <div className="image-navigation">
                  <button
                    className="nav-button prev-button"
                    onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : post.images.length - 1))}
                    disabled={!post.images || post.images.length <= 1}
                  >
                    &#10094;
                  </button>
                  <img
                    src={
                      post.images && post.images.length > 0
                        ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${post.images[selectedImage].url}`
                        : "https://via.placeholder.com/800x500?text=No+Image"
                    }
                    alt={post.title}
                    className="main-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <button
                    className="nav-button next-button"
                    onClick={() => setSelectedImage(prev => (prev < post.images.length - 1 ? prev + 1 : 0))}
                    disabled={!post.images || post.images.length <= 1}
                  >
                    &#10095;
                  </button>
                </div>
              )}
              {activeMediaTab === '3d' && (
                <div style={{ height: 520, background: '#000', borderRadius: 8, position: 'relative' }}>
                  {(() => {
                    console.log('[[DEBUG]] PostDetail 3D Render. Post Data:', JSON.parse(JSON.stringify(post)));
                    // Load tour từ backend (nếu có) hoặc fallback về cách cũ
                    let panoramaScenes = [];

                    // Ưu tiên: Load tour từ PanoramaTourEditor (nếu có)
                    if (post.panoramaTour || post.panoramaTourConfig) {
                      const tourConfig = post.panoramaTour || (typeof post.panoramaTourConfig === 'string' ? JSON.parse(post.panoramaTourConfig) : post.panoramaTourConfig);
                      console.log('[PostDetail 3D View] Tour config:', tourConfig);

                      if (tourConfig && tourConfig.scenes && Array.isArray(tourConfig.scenes)) {
                        // Map tour config sang format CustomImageTourViewer cần
                        panoramaScenes = tourConfig.scenes.map((sceneConfig, idx) => {
                          // Tìm ảnh tương ứng từ post.images (theo imageIndex đã lưu hoặc fallback theo index)
                          let image = null;
                          if (typeof sceneConfig.imageIndex === 'number' && post.images && post.images[sceneConfig.imageIndex]) {
                            image = post.images[sceneConfig.imageIndex];
                          } else if (post.images && post.images[idx]) {
                            // Fallback old behavior
                            image = post.images[idx];
                          }

                          const imageUrl = image ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${image.url}` : null;

                          return {
                            id: sceneConfig.id || `scene-${idx}`,
                            name: sceneConfig.name || `${post.title} - Scene ${idx + 1}`,
                            description: sceneConfig.description, // Map description
                            imageUrl: imageUrl,
                            panoramaUrl: imageUrl,
                            thumbUrl: imageUrl,
                            hotspots: (sceneConfig.hotspots || []).map(h => ({
                              id: h.id || `hotspot-${idx}-${h.yaw}-${h.pitch}`,
                              yaw: typeof h.yaw === 'number' ? h.yaw : (typeof h.x === 'number' ? h.x : 0),
                              pitch: typeof h.pitch === 'number' ? h.pitch : (typeof h.y === 'number' ? h.y : 0),
                              targetSceneId: h.targetSceneId || null,
                            })),
                          };
                        }).filter(s => s.imageUrl); // Chỉ lấy scenes có ảnh
                        console.log('[PostDetail 3D View] Mapped scenes from tour config:', panoramaScenes);
                      }
                    }



                    console.log('[PostDetail 3D View] Post data:', {
                      hasPanoramaTour: !!post.panoramaTour,
                      hasPanoramaTourConfig: !!post.panoramaTourConfig,
                      imagesCount: post.images?.length || 0,
                    });

                    if (panoramaScenes.length > 0) {
                      const tourData = post.panoramaTour || post.panoramaTourConfig;
                      const startupIndex = tourData?.startupSceneIndex !== undefined ? tourData.startupSceneIndex : 0;
                      const initialSceneId = panoramaScenes[startupIndex]?.id || panoramaScenes[0]?.id;

                      console.log('[PostDetail 3D View] Final scenes:', panoramaScenes);
                      console.log('[PostDetail 3D View] Initial scene ID:', initialSceneId);

                      return (
                        <CustomImageTourViewer
                          scenes={panoramaScenes}
                          initialSceneId={initialSceneId}
                          height={520}
                          controls={true}
                          showThumbs={panoramaScenes.length > 1}
                          onHotspotClick={(sceneId, hotspotId) => {
                            console.log('[PostDetail 3D View] Hotspot clicked:', { sceneId, hotspotId });
                            const scene = panoramaScenes.find(s => s.id === sceneId);
                            const hotspot = (scene?.hotspots || []).find(h => h.id === hotspotId);
                            console.log('[PostDetail 3D View] Hotspot data:', { scene, hotspot });
                            if (hotspot?.targetSceneId) {
                              console.log('[PostDetail 3D View] Target scene ID:', hotspot.targetSceneId);
                            }
                          }}
                        />
                      );
                    } else {
                      console.log('[PostDetail 3D View] No scenes available');
                      return (
                        <div style={{ height: 520, display: 'grid', placeItems: 'center', color: '#6b7280', background: '#0b0f19', borderRadius: 8 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔍</div>
                            <div>Chưa có ảnh panorama để xem tour 3D</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>Thêm ảnh panorama 360° để tạo tour</div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
              {activeMediaTab === 'street' && (
                <div style={{ height: 520, display: 'grid', placeItems: 'center', color: '#6b7280', background: '#0b0f19', borderRadius: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
                    <div>Nhấn tab "Street view" để mở Street View fullscreen</div>
                  </div>
                </div>
              )}

              {/* Fullscreen Street View Modal */}
              {showFullscreenStreetView && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: '#000',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Close button */}
                  <button
                    onClick={() => setShowFullscreenStreetView(false)}
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      zIndex: 10001,
                      background: 'rgba(45, 62, 80, 0.8)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>

                  {/* Fullscreen Street View - nhúng trực tiếp trong modal */}
                  <StreetViewComponent
                    address={fullAddressForMap || post?.address}
                    lat={post?.lat}
                    lng={post?.lng}
                    height={window.innerHeight}
                    apiKey={import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY}
                  />
                </div>
              )}

              {/* Fullscreen 3D Tour Modal*/}
              {showFullscreen3D && (() => {
                // Load tour từ backend (giống như tab 3D view)
                let panoramaScenes = [];

                // Ưu tiên: Load tour từ PanoramaTourEditor (nếu có)
                if (post.panoramaTour || post.panoramaTourConfig) {
                  const tourConfig = post.panoramaTour || (typeof post.panoramaTourConfig === 'string' ? JSON.parse(post.panoramaTourConfig) : post.panoramaTourConfig);

                  if (tourConfig && tourConfig.scenes && Array.isArray(tourConfig.scenes)) {
                    panoramaScenes = tourConfig.scenes.map((sceneConfig, idx) => {
                      let image = null;
                      if (typeof sceneConfig.imageIndex === 'number' && post.images && post.images[sceneConfig.imageIndex]) {
                        image = post.images[sceneConfig.imageIndex];
                      } else if (post.images && post.images[idx]) {
                        image = post.images[idx];
                      }
                      const imageUrl = image ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${image.url}` : null;

                      return {
                        id: sceneConfig.id || `scene-${idx}`,
                        name: sceneConfig.name || `${post.title} - Scene ${idx + 1}`,
                        imageUrl: imageUrl,
                        panoramaUrl: imageUrl,
                        thumbUrl: imageUrl,
                        hotspots: (sceneConfig.hotspots || []).map(h => ({
                          id: h.id || `hotspot-${idx}-${h.yaw}-${h.pitch}`,
                          yaw: typeof h.yaw === 'number' ? h.yaw : (typeof h.x === 'number' ? h.x : 0),
                          pitch: typeof h.pitch === 'number' ? h.pitch : (typeof h.y === 'number' ? h.y : 0),
                          targetSceneId: h.targetSceneId || null,
                        })),
                      };
                    }).filter(s => s.imageUrl);
                  }
                }

                // Fallback: Tạo scenes từ images
                if (panoramaScenes.length === 0 && post.images && post.images.length > 0) {
                  post.images.forEach((img, idx) => {
                    panoramaScenes.push({
                      id: `scene-${idx}`,
                      imageUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${img.url}`,
                      panoramaUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${img.url}`,
                      thumbUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${img.url}`,
                      name: `${post.title} - Ảnh ${idx + 1}`,
                      hotspots: [],
                    });
                  });

                  if (panoramaScenes.length > 1) {
                    panoramaScenes.forEach((scene, idx) => {
                      scene.hotspots = [
                        idx > 0 ? {
                          id: `hotspot-prev-${idx}`,
                          yaw: -90,
                          pitch: 0,
                          targetSceneId: panoramaScenes[idx - 1].id,
                        } : null,
                        idx < panoramaScenes.length - 1 ? {
                          id: `hotspot-next-${idx}`,
                          yaw: 90,
                          pitch: 0,
                          targetSceneId: panoramaScenes[idx + 1].id,
                        } : null
                      ].filter(Boolean);
                    });
                  }
                }

                if (panoramaScenes.length > 0) {
                  const initialSceneId = (post.panoramaTour || post.panoramaTourConfig)?.startupSceneIndex !== undefined
                    ? panoramaScenes[post.panoramaTour.startupSceneIndex || 0]?.id
                    : panoramaScenes[0]?.id;

                  return (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: '#000',
                      zIndex: 9999,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Close button */}
                      <button
                        onClick={() => setShowFullscreen3D(false)}
                        style={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          zIndex: 10000,
                          background: 'rgba(45, 62, 80, 0.8)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '24px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>

                      {/* Fullscreen 3D Viewer */}
                      <CustomImageTourViewer
                        scenes={panoramaScenes}
                        initialSceneId={initialSceneId}
                        height={window.innerHeight}
                        controls={true}
                        autoTour={true}
                        autoRotate={true}
                        littlePlanetIntro={true}
                        showThumbs={true}
                        fov={150}
                        fovMin={70}
                        fovMax={150}
                        onHotspotClick={(sceneId, hotspotId) => {
                          const scene = panoramaScenes.find(s => s.id === sceneId);
                          const hotspot = (scene?.hotspots || []).find(h => h.id === hotspotId);
                          if (hotspot?.targetSceneId) {
                            // CustomImageTourViewer sẽ tự xử lý chuyển scene qua onSceneChange
                          }
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })()}
              <button className='report-button' onClick={() => navigate(`/chi-tiet/${post.id}/report`)}>
                <i className="fas fa-flag"></i> Báo cáo
              </button>
              {post.images && post.images.length > 1 && (
                <div className="thumbnail-grid">
                  {post.images.map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${selectedImage === index ? "selected" : ""}`}
                      onMouseEnter={() => setSelectedImage(index)}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${image.url}`}
                        alt={`${post.title} - ${index + 1}`}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="post-info-section">
              <div className="info-section">
                <h1>Thông tin chi tiết</h1>
                <div className="info-grid">
                  <div className="info-item">
                    <FaHome />
                    <span>Loại: {post.category?.name}</span>
                  </div>
                  <div className="info-item">
                    <FaMoneyBillWave />
                    <span>Giá: {formatPrice(post.price, post.priceUnit)}</span>
                  </div>
                  <div className="info-item">
                    <FaRuler />
                    <span>Diện tích: {post.area_Size} m²</span>
                  </div>
                  <div className="info-item">
                    <FaUser />
                    <span>Người đăng: {post.user?.name}</span>
                  </div>
                  {post.soPhongNgu ? (
                    <div className="info-item">
                      <FaBed />
                      <span>Số phòng ngủ: {post.soPhongNgu}</span>
                    </div>
                  ) : null}
                  {post.soPhongTam ? (
                    <div className="info-item">
                      <FaBath />
                      <span>Số phòng tắm/WC: {post.soPhongTam}</span>
                    </div>
                  ) : null}
                  {post.soTang ? (
                    <div className="info-item">
                      <FaBuilding />
                      <span>Số tầng: {post.soTang}</span>
                    </div>
                  ) : null}
                  {post.huongNha ? (
                    <div className="info-item">
                      <FaCompass />
                      <span>Hướng nhà: {post.huongNha}</span>
                    </div>
                  ) : null}
                  {post.huongBanCong ? (
                    <div className="info-item">
                      <FaLocationArrow />
                      <span>Hướng ban công: {post.huongBanCong}</span>
                    </div>
                  ) : null}
                  {post.matTien ? (
                    <div className="info-item">
                      <FaWarehouse />
                      <span>Mặt tiền: {post.matTien} m</span>
                    </div>
                  ) : null}
                  {post.duongVao ? (
                    <div className="info-item">
                      <FaRoad />
                      <span>Đường vào: {post.duongVao} m</span>
                    </div>
                  ) : null}
                  {post.phapLy ? (
                    <div className="info-item">
                      <FaFileAlt />
                      <span>Pháp lý: {post.phapLy}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="description">
                <h1>Mô tả</h1>
                <p>{post.description}</p>
              </div>

              {/* Price Chart - Lịch sử giá thị trường */}
              <PriceChart
                cityId={post.area?.cityId}
                districtId={post.area?.districtId}
                categoryId={post.categoryId}
                transactionType={typeof post.transactionType === 'number' ? post.transactionType : (post.transactionType === 'Sale' ? 0 : 1)}
                currentPrice={post.priceUnit === PriceUnit.Tỷ || post.priceUnit === 0 ? post.price * 1000 : post.price}
                areaSize={post.area_Size}
                title={`Lịch sử giá ${post.transactionType === 0 || post.transactionType === 'Sale' ? 'bán' : 'thuê'} ${post.category?.name || 'BĐS'} tại ${post.cityName || post.area?.city?.name || 'khu vực này'}`}
              />

              {/* Mortgage Calculator - Chỉ hiện cho bài bán */}
              {(post.transactionType === 0 || post.transactionType === 'Sale' || post.transactionType === TransactionType.Sale) && (
                <MortgageCalculator 
                  propertyPrice={post.priceUnit === PriceUnit.Tỷ || post.priceUnit === 0 ? post.price * 1000000000 : post.price * 1000000}
                />
              )}
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="post-contact">
            <div className="price-tag">
              {formatPrice(post.price, post.priceUnit)}
            </div>
            <div className="price-per-m2" >
              {getPricePerSquareMeter()}
            </div>
            <div className={`transaction-type ${post.transactionType === 0 ? 'sale' : 'rent'}`}>
              {post.transactionType === 0 ? "Mua bán" : "Cho thuê"}
            </div>

            {/* Contact Information */}
            <div className="contact-section">
              <h2 className="section-title">Thông tin liên hệ</h2>
              <div className="contact-info">
                <Link 
                  to={`/user/${post.userId}/posts`} 
                  className="contact-item"
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <img
                    src={post.user?.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/${post.user.avatarUrl}` : '/default-avatar.png'}
                    alt={post.user?.name || 'User'}
                    style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      marginRight: 8,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #f97316';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      {post.user?.name}
                    </span>
                    {isProRole(post.user?.role) && (
                      <span className="pro-badge" style={{ position: 'static', marginLeft: 6, padding: '4px 10px', fontSize: '0.95em', height: 28 }}>
                        <FaCrown className="pro-crown-icon" /> Pro
                      </span>
                    )}
                  </span>
                </Link>
                {/* Phone Button / Tooltip */}
                <div className="contact-item" style={{ position: 'relative' }}>
                  {user ? (
                    <a
                      href={`tel:${post.user?.phone || ''}`}
                      className="chat-button"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <FaPhone className="contact-icon" />
                      <span>{post.user?.phone}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="chat-button"
                      onClick={() => setShowLoginTooltip(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <FaPhone className="contact-icon" />
                      <span>{maskPhone(post.user?.phone)}</span>
                    </button>
                  )}
                  {!user && showLoginTooltip && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '100%',
                        marginLeft: 12,
                        background: '#1f2937',
                        color: '#fff',
                        padding: '12px 14px',
                        borderRadius: 8,
                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                        zIndex: 20,
                        minWidth: 240
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Đăng nhập để liên hệ với người bán</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setShowLoginTooltip(false)}
                          style={{ padding: '6px 10px', background: '#374151', color: '#fff', borderRadius: 6 }}
                        >
                          Bỏ qua
                        </button>
                        <Link
                          to="/login"
                          style={{ padding: '6px 10px', background: '#f97316', color: '#fff', borderRadius: 6 }}
                        >
                          Đăng nhập
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <span>{user ? post.user?.email : maskEmail(post.user?.email)}</span>
                </div>
              </div>
            </div>

            {/* Add Chat Button */}
            {user && user.id !== post.userId && (
              <div className="chat-button-container">
                <Link
                  to={`/chat?u=${post.user.id}&postId=${post.id}&postTitle=${encodeURIComponent(post.title)}&avatar=${encodeURIComponent(post.user.avatarUrl || '')}`}
                  className="chat-button"
                >
                  <FaCommentDots className="mr-2" />
                  Nhắn tin
                </Link>
              </div>
            )}

            {user && (user.id === post.userId) && (
              <div className="action-buttons">
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit className="mr-2" />
                  Chỉnh sửa
                </button>
                <button
                  className="delete-button"
                  onClick={handleDelete}
                >
                  <FaTrash className="mr-2" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal - Full Screen */}
      {showMapModal && (post.wardName || post.area?.ward?.name || post.street_Name) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            background: '#f97316',
            color: 'white'
          }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Bản đồ</h2>
            <button 
              onClick={handleCloseMapModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: 28,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          {/* Map Container - Full Height */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapComponent 
              address={fullAddressForMap} 
              latitude={post.latitude}
              longitude={post.longitude}
              zoom={17} 
              radius={200} 
              mapHeight="100%" 
            />
          </div>
          
          {/* Footer với tọa độ và link Google Maps */}
          {(post.latitude && post.longitude) && (
            <div style={{ 
              padding: '12px 20px', 
              backgroundColor: '#fff', 
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <strong>📍 Tọa độ:</strong> {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
              </div>
              <a 
                href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                🗺️ Mở Google Maps
              </a>
            </div>
          )}
        </div>
      )}

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chỉnh sửa bài viết</h2>
              <button onClick={() => setIsEditing(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Tiêu đề</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="form-input"
                  rows="4"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <select
                    value={editForm.priceUnit}
                    onChange={(e) => setEditForm({ ...editForm, priceUnit: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value={PriceUnit.Triệu}>Triệu</option>
                    <option value={PriceUnit.Tỷ}>Tỷ</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={editForm.area_Size}
                    onChange={(e) => setEditForm({ ...editForm, area_Size: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thành phố</label>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value, district: '', ward: '', areaId: '' })}
                    className="form-input"
                    required
                  >
                    <option value="">-- Chọn thành phố --</option>
                    {uniqueCities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quận/Huyện</label>
                  <select
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value, ward: '', areaId: '' })}
                    className="form-input"
                    required
                    disabled={!editForm.city}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {filteredDistricts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phường/Xã</label>
                  <select
                    value={editForm.ward}
                    onChange={(e) => setEditForm({ ...editForm, ward: e.target.value, areaId: e.target.value })}
                    className="form-input"
                    required
                    disabled={!editForm.district}
                  >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {filteredWards.map(ward => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Số phòng ngủ</label>
                  <input
                    type="number"
                    value={editForm.soPhongNgu}
                    onChange={e => setEditForm({ ...editForm, soPhongNgu: e.target.value })}
                    className="form-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số phòng tắm/WC</label>
                  <input
                    type="number"
                    value={editForm.soPhongTam}
                    onChange={e => setEditForm({ ...editForm, soPhongTam: e.target.value })}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Số tầng</label>
                  <input
                    type="number"
                    value={editForm.soTang}
                    onChange={e => setEditForm({ ...editForm, soTang: e.target.value })}
                    className="form-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hướng nhà</label>
                  <input
                    type="text"
                    value={editForm.huongNha}
                    onChange={e => setEditForm({ ...editForm, huongNha: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hướng ban công</label>
                  <input
                    type="text"
                    value={editForm.huongBanCong}
                    onChange={e => setEditForm({ ...editForm, huongBanCong: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mặt tiền (m)</label>
                  <input
                    type="number"
                    value={editForm.matTien}
                    onChange={e => setEditForm({ ...editForm, matTien: e.target.value })}
                    className="form-input"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Đường vào (m)</label>
                  <input
                    type="number"
                    value={editForm.duongVao}
                    onChange={e => setEditForm({ ...editForm, duongVao: e.target.value })}
                    className="form-input"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pháp lý</label>
                  <input
                    type="text"
                    value={editForm.phapLy}
                    onChange={e => setEditForm({ ...editForm, phapLy: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Loại bất động sản</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tên đường</label>
                  <input
                    type="text"
                    value={editForm.street_Name}
                    onChange={(e) => setEditForm({ ...editForm, street_Name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hình ảnh mới (nếu muốn thay đổi)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewImages(e.target.files)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Loại giao dịch</label>
                <select
                  value={editForm.transactionType}
                  onChange={(e) => setEditForm({ ...editForm, transactionType: parseInt(e.target.value) })}
                  className="form-input"
                  required
                >
                  <option value={TransactionType.Sale}>Mua bán</option>
                  <option value={TransactionType.Rent}>Cho thuê</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">
                  Hủy
                </button>
                <button type="submit" className="submit-button">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPanorama && post.images && post.images.length > 0 && (
        <PanoramaViewer
          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${post.images[selectedImage].url}`}
          onClose={() => setShowPanorama(false)}
        />
      )}

      {/* Tin đăng tương tự */}
      {relatedPosts.length > 0 && (
        <div style={{
          maxWidth: 1200,
          margin: '40px auto',
          padding: '20px',
          background: '#03030aff',
          borderRadius: 12
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 20,
            color: '#fff'
          }}>
            Tin đăng tương tự
          </h2>
          <div style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 8
          }}>
            {relatedPosts.map((relatedPost) => (
              <Link 
                key={relatedPost.id} 
                to={`/chi-tiet/${relatedPost.id}`}
                style={{
                  flex: '0 0 200px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{
                  background: '#ffffffff',
                  borderRadius: 8,
                  overflow: 'hidden',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Ảnh vuông */}
                  <div style={{ position: 'relative', paddingTop: '100%' }}>
                    <img
                      src={relatedPost.images?.[0]?.url 
                        ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${relatedPost.images[0].url}`
                        : 'https://via.placeholder.com/200x200?text=No+Image'
                      }
                      alt={relatedPost.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    {/* Thời gian đăng */}
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10
                    }}>
                      {relatedPost.created ? new Date(relatedPost.created).toLocaleDateString('vi-VN') : ''}
                    </div>
                    {/* Số ảnh */}
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      📷 {relatedPost.images?.length || 0}
                    </div>
                  </div>
                  
                  {/* Thông tin */}
                  <div style={{ padding: 10 }}>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                      height: 34,
                      color: '#fff'
                    }}>
                      {relatedPost.title}
                    </h3>
                    
                    {/* Diện tích */}
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                      Diện tích: {relatedPost.area_Size} m²
                    </div>
                    
                    {/* Giá */}
                    <div style={{ 
                      color: '#f97316', 
                      fontWeight: 700, 
                      fontSize: 14,
                      marginBottom: 4
                    }}>
                      {formatPrice(relatedPost.price, relatedPost.priceUnit)}
                      
                    </div>
                    
                    {/* Địa chỉ */}
                    <div style={{ 
                      fontSize: 11, 
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <FaMapMarkerAlt size={10} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {relatedPost.wardName || relatedPost.area?.ward?.name || ''}{relatedPost.wardName || relatedPost.area?.ward?.name ? ', ' : ''}{relatedPost.districtName || relatedPost.area?.district?.name || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
