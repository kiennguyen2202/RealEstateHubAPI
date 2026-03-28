import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Steps,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  message,
  notification,
  Card,
  Row,
  Col,
  Modal,
  Radio,
  Segmented,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import axiosPrivate from "../../api/axiosPrivate.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import MessageProvider from "../../components/MessageProvider.jsx";
import { userService } from "../../api/userService.js";
import MapComponent from "../../components/MapComponent.jsx";
import { toast } from "react-toastify";
import MapPicker from "../../components/MapPicker.jsx";
import PanoramaTourEditor from "../../components/PanoramaTourEditor.jsx";
import { getProvinces, getDistrictsByProvince, getWardsByDistrict } from "../../api/vietnamAddressService.js";

const { Step } = Steps;
const { Option } = Select;

// Định nghĩa enum PriceUnit tương tự như ở backend
const PriceUnit = {
  Tỷ: 0,
  Triệu: 1,
};

// Hook custom để quản lý session storage với userId
const useFormSession = (key, initialValue, userId) => {
  const storageKey = userId ? `createPostWizard_${userId}_${key}` : key;

  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : initialValue;
  });

  const setValueWithStorage = (newValue) => {
    setValue(newValue);
    sessionStorage.setItem(storageKey, JSON.stringify(newValue));
  };

  const clearStorage = () => {
    sessionStorage.removeItem(storageKey);
    setValue(initialValue);
  };

  return [value, setValueWithStorage, clearStorage];
};

const getMapZoom = (cityId, districtId, wardId) => {
  const minZoom = 5;
  if (wardId && String(wardId) !== "") return minZoom + 12;
  if (districtId && String(districtId) !== "") return minZoom + 10;
  if (cityId && String(cityId) !== "") return minZoom + 8;
  return minZoom;
};

const CreatePostWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showMessage, contextHolder } = MessageProvider();
  const getLimitInfo = (roleName) => {
    switch (roleName) {
      case "Pro_1":
        return { limit: 100, days: 30 };
      case "Pro_3":
        return { limit: 300, days: 90 };
      case "Pro_12":
        return { limit: 1200, days: 365 };
      default:
        return { limit: 5, days: 7 };
    }
  };

  // Luôn bắt đầu từ bước 1 khi vào trang
  const [current, setCurrent] = useState(0);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  // AI modal states
  const [aiVisible, setAiVisible] = useState(false);
  const [aiTone, setAiTone] = useState("Lịch sự"); // 'Lịch sự' | 'Trẻ trung'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");

  // Panorama editor states
  const [panoEditorVisible, setPanoEditorVisible] = useState(false);
  const [panoTourData, setPanoTourData] = useState(null);
  const [uploadMode, setUploadMode] = useState("regular");

  const formatPriceWithUnit = (price, unit) => {
    if (price == null || isNaN(Number(price))) return "";
    const n = Number(price);
    const u = Number(unit);
    const unitText = u === PriceUnit.Tỷ ? "tỷ" : "triệu";
    return `${n.toLocaleString("vi-VN")} ${unitText} VNĐ`;
  };

  const getAddressText = () => {
    // Ưu tiên địa chỉ từ map nếu có
    if (addressFromMap?.fullAddress) {
      return addressFromMap.fullAddress;
    }
    
    // Fallback: dùng dropdown
    const parts = [];
    if (streetName) parts.push(streetName);
    const wardObj = filteredWards.find((w) => String(w.id) === String(ward));
    if (wardObj?.name) parts.push(wardObj.name);
    const districtObj = filteredDistricts.find(
      (d) => String(d.id) === String(district),
    );
    if (districtObj?.name) parts.push(districtObj.name);
    const cityObj = uniqueCities.find((c) => String(c.id) === String(city));
    if (cityObj?.name) parts.push(cityObj.name);
    return parts.join(", ");
  };

  const buildAiSourceData = () => {
    const v = form.getFieldsValue(true);

    // Tìm tên category từ categoryId
    const categoryObj = categories.find(
      (cat) => String(cat.id) === String(v.categoryId),
    );
    const categoryName = categoryObj?.name || "";

    return {
      category: categoryName,
      transactionType: v.transactionType,
      address: getAddressText(),
      price: v.price,
      priceUnit: v.priceUnit,
      areaSize: v.area_Size,
      bedrooms: v.soPhongNgu,
      bathrooms: v.soPhongTam,
      floors: v.soTang,
      direction: v.huongNha,
      balcony: v.huongBanCong,
      frontage: v.matTien,
      alley: v.duongVao,
      legal: v.phapLy,
      username: v.username,
      userphone: v.userphone,
    };
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const data = buildAiSourceData();
      

      // Try backend AI first
      try {
        const res = await axiosPrivate.post("/api/ai/generate-listing", {
          category: data.category,
          transactionType: data.transactionType,
          address: data.address,
          price: data.price,
          priceUnit: data.priceUnit,
          areaSize: data.areaSize,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          floors: data.floors,
          direction: data.direction,
          balcony: data.balcony,
          frontage: data.frontage,
          alley: data.alley,
          legal: data.legal,
          tone: aiTone,
          userName: user?.name || null,
          userPhone: user?.phone || null,
        });


        if (res?.data) {
          setAiTitle(res.data.title || "");
          setAiDescription(res.data.description || "");
          message.success("AI đã tạo nội dung thành công!");
          return;
        }
      } catch (e) {
        console.error("❌ API Error:", e);
        console.error(
          "Error response data:",
          JSON.stringify(e.response?.data, null, 2),
        );
        console.error("Error response full:", e.response);
        console.error("Error status:", e.response?.status);
        console.error("Error message:", e.message);

        // Show user-friendly error message
        let errorMsg = "Dịch vụ AI tạm thời không khả dụng";

        if (e.response?.data?.detail?.includes("User not found")) {
          errorMsg = "Cấu hình AI chưa được thiết lập đúng. Vui lòng liên hệ quản trị viên.";
        } else if (e.response?.data?.detail?.includes("401")) {
          errorMsg = "Khóa API AI không hợp lệ. Vui lòng liên hệ quản trị viên.";
        } else if (e.response?.data?.message) {
          errorMsg = e.response.data.message;
        }

        message.error(`Không thể tạo nội dung AI: ${errorMsg}`);
        return;
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (aiTitle) form.setFieldsValue({ title: aiTitle });
    if (aiDescription) form.setFieldsValue({ description: aiDescription });
    setAiVisible(false);
  };

  // Sử dụng session storage cho các state quan trọng với userId
  const [imagePreviews, setImagePreviews] = useFormSession(
    "ImagePreviews",
    [],
    user?.id,
  );
  const [imagesBase64, setImagesBase64] = useState([]);
  const [files, setFiles] = useState([]); // Controlled fileList for Upload
  const [fullAddress, setFullAddress] = useFormSession(
    "FullAddress",
    "",
    user?.id,
  );
  const [mapAddress, setMapAddress] = useFormSession(
    "MapAddress", 
    "", 
    user?.id,
  ); // Địa chỉ chỉ đến cấp phường/xã cho map
  const [zoomLevel, setZoomLevel] = useFormSession("ZoomLevel", 5, user?.id);
  const [latitude, setLatitude] = useFormSession("Latitude", null, user?.id);
  const [longitude, setLongitude] = useFormSession("Longitude", null, user?.id);
  
  // Địa chỉ từ map (khi user chọn vị trí trên bản đồ)
  const [addressFromMap, setAddressFromMap] = useFormSession("AddressFromMap", null, user?.id);

  // Sử dụng session storage cho địa chỉ với userId
  const [city, setCity] = useFormSession("City", "", user?.id);
  const [district, setDistrict] = useFormSession("District", "", user?.id);
  const [ward, setWard] = useFormSession("Ward", "", user?.id);
  const [streetName, setStreetName] = useFormSession(
    "StreetName",
    "",
    user?.id,
  );

  const [categories, setCategories] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);

  // Cấu hình thông báo để hiển thị đầy đủ nội dung và nằm gọn trong màn hình
  useEffect(() => {
    try {
      notification.config({
        placement: "top",
        top: 16,
        maxCount: 1,
        duration: 6,
      });
    } catch (_) { }
  }, []);

  // Fetch data khi component mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Lấy categories từ backend, địa chỉ từ API công khai
        const [categoriesRes, provincesData] = await Promise.all([
          axiosPrivate.get("/api/categories"),
          getProvinces(),
        ]);

        setCategories(categoriesRes.data);
        // Map provinces sang format tương thích
        setUniqueCities(provincesData.map(p => ({
          id: p.code,
          code: p.code,
          name: p.name,
        })));

        // Load địa chỉ từ session storage và fetch districts/wards nếu cần
        if (city) {
          handleCityChange(city);
        }
        if (district) {
          handleDistrictChange(district);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      }
    };

    fetchData();
  }, [user, navigate, form]);

  // Kiểm tra tin nháp sau khi đã có dữ liệu areas
  useEffect(() => {
    if (user?.id && uniqueCities.length > 0) {
      // Chỉ kiểm tra khi có cities, không cần đợi districts/wards
      checkForDraft().then((hasDraft) => {
        if (hasDraft) {
          setShowDraftPopup(true);
        }
      });
    }
  }, [user, uniqueCities]);

  // Kiểm tra có tin nháp không
  const checkForDraft = async () => {
    if (!user?.id) return false;

    try {
      const response = await axiosPrivate.get("/api/posts/draft");
      if (response.data.hasDraft) {
        // Lưu dữ liệu draft vào session storage để hiển thị popup
        const { formData, currentStep } = response.data;
        const draftData = { ...formData, currentStep };
        sessionStorage.setItem(
          `draftData_${user.id}`,
          JSON.stringify(draftData),
        );
      }
      return response.data.hasDraft;
    } catch (error) {
      console.error("Lỗi khi kiểm tra tin nháp:", error);
      return false;
    }
  };

  // Load tin nháp
  const loadDraft = async () => {
    if (!user?.id) return;

    try {
      const response = await axiosPrivate.get("/api/posts/draft");
      if (response.data.hasDraft) {
        const { formData, currentStep } = response.data;


        // Lưu dữ liệu draft vào session storage để hiển thị
        const draftData = { ...formData, currentStep };
        sessionStorage.setItem(
          `draftData_${user.id}`,
          JSON.stringify(draftData),
        );

        // Cập nhật state địa chỉ trước
        if (formData.city) {
          setCity(formData.city);
          await handleCityChange(formData.city);
        }
        if (formData.district) {
          setDistrict(formData.district);
          await handleDistrictChange(formData.district);
        }
        if (formData.ward) {
          setWard(formData.ward);
        }
        if (formData.street_Name) {
          setStreetName(formData.street_Name);
        }

        // Load hình ảnh nếu có
        let draftFileList = [];
        if (formData.images && formData.images.fileList) {
          
          draftFileList = formData.images.fileList;
        } else if (Array.isArray(formData.images)) {
          draftFileList = formData.images;
        }

        // Nếu không có fileList, thử từ imagesBase64 (được lưu khi user chọn ảnh)
        if (
          (!draftFileList || draftFileList.length === 0) &&
          Array.isArray(formData.imagesBase64)
        ) {
          draftFileList = formData.imagesBase64.map((img, index) => ({
            uid: img.uid || `draft-image-${index}`,
            name: img.name || `image-${index + 1}`,
            status: "done",
            thumbUrl: img.dataUrl,
            url: img.dataUrl,
          }));
        }

        if (draftFileList.length > 0) {
          const normalizedFileList = draftFileList.map((file, index) => {
            const isFileObj =
              typeof File !== "undefined" && file.originFileObj instanceof File;
            const thumb =
              file.thumbUrl ||
              file.url ||
              file.preview ||
              (isFileObj
                ? URL.createObjectURL(file.originFileObj)
                : undefined) ||
              (file.dataUrl ?? undefined);
            return {
              uid: file.uid || `draft-image-${index}`,
              name: file.name || `image-${index + 1}`,
              status: file.status || "done",
              type: file.type || "image/jpeg",
              originFileObj: isFileObj ? file.originFileObj : undefined,
              url: file.url || thumb,
              thumbUrl: thumb,
              preview: thumb,
            };
          });

          // cập nhật previews cho popup (ưu tiên dataUrl để bền qua reload)
          const previews = normalizedFileList
            .map((f) => f.thumbUrl)
            .filter(Boolean);
          setImagePreviews(previews);

          // bind lại vào form theo đúng schema của Upload
          form.setFieldsValue({ images: normalizedFileList });
          setFiles(normalizedFileList);

          // giữ lại danh sách đã chuẩn hoá khi set toàn bộ form phía dưới
          formData.images = normalizedFileList;
        }

        // Set form values sau khi đã có dữ liệu areas
        form.setFieldsValue(formData);
setCurrent(currentStep || 0);

        setShowDraftPopup(false);
        showMessage.success("Đã tải tin nháp thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nháp:", error);
      showMessage.error("Không thể tải tin nháp. Vui lòng thử lại.");
    }
  };

  // Lưu tin nháp
  const saveDraft = async () => {
    if (!user?.id) return;

    const currentValues = { ...form.getFieldsValue(true), imagesBase64 };
    if (Object.keys(currentValues).length > 0) {
      try {
        const response = await axiosPrivate.post("/api/posts/draft/save", {
          formData: currentValues,
          currentStep: current,
        });

        if (response.data) {
          showMessage.success("Đã lưu tin nháp thành công!");
        }
      } catch (error) {
        console.error("Lỗi khi lưu tin nháp:", error);
        showMessage.error("Không thể lưu tin nháp. Vui lòng thử lại.");
      }
    }
  };

  // Helper functions để hiển thị thông tin tin nháp
  const getDraftTitle = () => {
    if (!user?.id) return "---";
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        return parsed.title || "Chưa có tiêu đề";
      }
    } catch (e) {
      return "---";
    }
    return "---";
  };

  const getDraftAddress = () => {
    if (!user?.id) return "---";
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        const addressParts = [];

        // Lấy tên đường
        if (parsed.street_Name) {
          addressParts.push(parsed.street_Name);
        }

        // Lấy tên phường/xã
        if (parsed.ward) {
          const wardObj = filteredWards.find(
            (w) => String(w.id) === String(parsed.ward),
          );
          if (wardObj) addressParts.push(wardObj.name);
        }

        // Lấy tên quận/huyện
        if (parsed.district) {
          const districtObj = filteredDistricts.find(
            (d) => String(d.id) === String(parsed.district),
          );
          if (districtObj) addressParts.push(districtObj.name);
        }

        // Lấy tên thành phố
        if (parsed.city) {
          const cityObj = uniqueCities.find(
            (c) => String(c.id) === String(parsed.city),
          );
          if (cityObj) addressParts.push(cityObj.name);
        }

        return addressParts.length > 0
          ? addressParts.join(", ")
          : "Chưa có địa chỉ";
      }
    } catch (e) {
      return "---";
    }
    return "---";
  };

  const getDraftPrice = () => {
    if (!user?.id) return "---";
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        if (parsed.price) {
          const unit = parsed.priceUnit === 0 ? "Tỷ" : "Triệu";
          return `${parsed.price} ${unit}`;
        }
        return "Chưa có giá";
      }
    } catch (e) {
      return "---";
    }
    return "---";
  };

  const getDraftImages = () => {
    if (!user?.id) return [];
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);

        // Ưu tiên imagesBase64 nếu có (bền qua reload)
        if (
          Array.isArray(parsed.imagesBase64) &&
          parsed.imagesBase64.length > 0
        ) {
          return parsed.imagesBase64.map((img, index) => ({
            thumbUrl: img.dataUrl,
            uid: img.uid || `draft-image-${index}`,
          }));
        }

        // Thử lấy từ fileList trước
        if (
          parsed.images &&
          parsed.images.fileList &&
          parsed.images.fileList.length > 0
        ) {
          return parsed.images.fileList.map((file, index) => ({
            thumbUrl: file.thumbUrl || file.url || file.preview,
            uid: file.uid || `draft-image-${index}`,
          }));
        }

        // Thử lấy từ imagePreviews nếu không có fileList
        if (imagePreviews && imagePreviews.length > 0) {
          return imagePreviews.map((url, index) => ({
            thumbUrl: url,
            uid: `draft-image-${index}`,
          }));
        }

        // Thử lấy từ parsed.images trực tiếp
        if (parsed.images && Array.isArray(parsed.images)) {
          return parsed.images.map((img, index) => {
            const url =
              typeof img === "string"
                ? img
                : img.thumbUrl || img.url || img.preview;
            return {
              thumbUrl: url,
              uid: `draft-image-${index}`,
            };
          });
        }

        // No images
      }
    } catch (e) {
      return [];
    }
    return [];
  };

  const getDraftStep = () => {
    if (!user?.id) return "---";
    try {
      const draftData = sessionStorage.getItem(`draftData_${user.id}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        const stepNames = [
          "Hình thức",
          "Địa chỉ",
          "Thông tin",
          "Tiêu đề & Mô tả",
          "Hình ảnh",
        ];
        return (
          stepNames[parsed.currentStep] || `Bước ${parsed.currentStep + 1}`
        );
      }
    } catch (e) {
      return "---";
    }
    return "---";
  };

  // Bỏ qua tin nháp
  const ignoreDraft = async () => {
    setShowDraftPopup(false);

    // Xóa tin nháp từ server và session storage
    if (user?.id) {
      try {
        await axiosPrivate.delete("/api/posts/draft");
        // Xóa session storage
        sessionStorage.removeItem(`draftData_${user.id}`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_ImagePreviews`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_FullAddress`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_MapAddress`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_ZoomLevel`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_Latitude`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_Longitude`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_City`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_District`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_Ward`);
        sessionStorage.removeItem(`createPostWizard_${user.id}_StreetName`);

        // Reset form và state
        form.resetFields();
        setCurrent(0);
        setCity("");
        setDistrict("");
        setWard("");
        setStreetName("");
        setImagePreviews([]);
        setFiles([]);
        setFullAddress("");
        setMapAddress("");
        setZoomLevel(5);
        setLatitude(null);
        setLongitude(null);

        // Clear file upload component
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = "";
        }

        showMessage.success("Đã xóa tin nháp thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa tin nháp:", error);
        showMessage.error("Không thể xóa tin nháp. Vui lòng thử lại.");
      }
    }
  };

  useEffect(() => {
    // Địa chỉ đầy đủ (có tên đường) cho form
    let fullAddressParts = [];
    if (streetName) {
      fullAddressParts.push(streetName);
    }
    if (ward && String(ward) !== "") {
      const wardObj = filteredWards.find((w) => String(w.id) === String(ward) || String(w.code) === String(ward));
      if (wardObj) fullAddressParts.push(wardObj.name);
    }
    if (district && String(district) !== "") {
      const districtObj = filteredDistricts.find(
        (d) => String(d.id) === String(district) || String(d.code) === String(district),
      );
      if (districtObj) fullAddressParts.push(districtObj.name);
    }
    if (city && String(city) !== "") {
      const cityObj = uniqueCities.find((c) => String(c.id) === String(city) || String(c.code) === String(city));
      if (cityObj) fullAddressParts.push(cityObj.name);
    }
    setFullAddress(fullAddressParts.filter(Boolean).join(", "));

    // Địa chỉ cho map (chỉ đến cấp phường/xã, không có tên đường)
    let mapAddressParts = [];
    if (ward && String(ward) !== "") {
      const wardObj = filteredWards.find((w) => String(w.id) === String(ward) || String(w.code) === String(ward));
      if (wardObj) mapAddressParts.push(wardObj.name);
    }
    if (district && String(district) !== "") {
      const districtObj = filteredDistricts.find(
        (d) => String(d.id) === String(district) || String(d.code) === String(district),
      );
      if (districtObj) mapAddressParts.push(districtObj.name);
    }
    if (city && String(city) !== "") {
      const cityObj = uniqueCities.find((c) => String(c.id) === String(city) || String(c.code) === String(city));
      if (cityObj) mapAddressParts.push(cityObj.name);
    }
    setMapAddress(mapAddressParts.filter(Boolean).join(", "));

    const newZoomLevel = getMapZoom(city, district, ward);
    setZoomLevel(newZoomLevel);
  }, [
    city,
    district,
    ward,
    streetName,
    filteredDistricts,
    filteredWards,
    uniqueCities,
  ]);

  // Helper function để fetch tọa độ từ địa chỉ
  const fetchCoordinates = async (searchAddress) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'RealEstateHub/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error('Lỗi khi lấy tọa độ:', error);
    }
    return null;
  };

  // Handler khi chọn thành phố - sử dụng API công khai
  const handleCityChange = async (provinceCode) => {
    setCity(provinceCode);
    setDistrict("");
    setWard("");
    setStreetName("");
    setFilteredWards([]);
    setFilteredDistricts([]);
    setAddressFromMap(null); // Reset địa chỉ từ map
    
    if (provinceCode) {
      try {
        const districts = await getDistrictsByProvince(provinceCode);
        setFilteredDistricts(districts.map(d => ({
          id: d.code,
          code: d.code,
          name: d.name,
        })));
        
        // Fetch tọa độ cho thành phố
        const cityObj = uniqueCities.find(c => String(c.code) === String(provinceCode));
        if (cityObj?.name) {
          const coords = await fetchCoordinates(`${cityObj.name}, Vietnam`);
          if (coords) {
            setLatitude(coords.lat);
            setLongitude(coords.lng);
          }
        }
      } catch (err) {
        console.error("Error fetching districts:", err);
        setFilteredDistricts([]);
      }
    }
  };

  // Handler khi chọn quận/huyện - sử dụng API công khai
  const handleDistrictChange = async (districtCode) => {
    setDistrict(districtCode);
    setWard("");
    setFilteredWards([]);
    setAddressFromMap(null); // Reset địa chỉ từ map
    
    if (districtCode) {
      try {
        const wards = await getWardsByDistrict(districtCode);
        setFilteredWards(wards.map(w => ({
          id: w.code,
          code: w.code,
          name: w.name,
        })));
        
        // Fetch tọa độ cho quận/huyện
        const districtObj = filteredDistricts.find(d => String(d.code) === String(districtCode));
        const cityObj = uniqueCities.find(c => String(c.code) === String(city));
        if (districtObj?.name && cityObj?.name) {
          const coords = await fetchCoordinates(`${districtObj.name}, ${cityObj.name}, Vietnam`);
          if (coords) {
            setLatitude(coords.lat);
            setLongitude(coords.lng);
          }
        }
      } catch (err) {
        console.error("Error fetching wards:", err);
        setFilteredWards([]);
      }
    }
  };

  const handleWardChange = async (wardCode) => {
    setWard(wardCode);
    
    // Lấy tọa độ từ ward (chỉ đến cấp phường/xã, không bao gồm tên đường)
    if (wardCode) {
      const wardObj = filteredWards.find((w) => String(w.id) === String(wardCode) || String(w.code) === String(wardCode));
      if (wardObj?.name) {
        const districtObj = filteredDistricts.find(
          (d) => String(d.id) === String(district) || String(d.code) === String(district),
        );
        const cityObj = uniqueCities.find((c) => String(c.id) === String(city) || String(c.code) === String(city));
        
        // Thử nhiều cách tìm kiếm khác nhau
        const searchQueries = [
          `${wardObj.name}, ${districtObj?.name || ''}, ${cityObj?.name || ''}, Vietnam`,
          `${districtObj?.name || ''}, ${cityObj?.name || ''}, Vietnam`,
          `${cityObj?.name || ''}, Vietnam`,
        ];
        
        let found = false;
        for (const searchAddress of searchQueries) {
          if (found) break;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`,
              { headers: { 'User-Agent': 'RealEstateHub/1.0' } }
            );
            const data = await response.json();
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              setLatitude(lat);
              setLongitude(lon);
              found = true;
            }
          } catch (error) {
            console.error('Lỗi khi lấy tọa độ:', error);
          }
        }
        
        // Fallback: nếu không tìm được, dùng tọa độ mặc định của một số thành phố lớn
        if (!found && cityObj?.name) {
          const defaultCoords = {
            'Thành phố Hà Nội': { lat: 21.0285, lon: 105.8542 },
            'Thành phố Hồ Chí Minh': { lat: 10.8231, lon: 106.6297 },
            'Thành phố Đà Nẵng': { lat: 16.0544, lon: 108.2022 },
            'Thành phố Hải Phòng': { lat: 20.8449, lon: 106.6881 },
            'Thành phố Cần Thơ': { lat: 10.0452, lon: 105.7469 },
          };
          const fallback = defaultCoords[cityObj.name];
          if (fallback) {
            setLatitude(fallback.lat);
            setLongitude(fallback.lon);
          }
        }
      }
    } else {
      setLatitude(null);
      setLongitude(null);
    }
  };
  const handleStreetChange = (e) => {
    setStreetName(e.target.value);
  };

  // Handle file upload
  const handleFileChange = (info) => {
    const { fileList } = info;
    const enrichedFileList = fileList.map((f) => ({
      ...f,
      thumbUrl:
        f.thumbUrl ||
        (f.originFileObj
          ? URL.createObjectURL(f.originFileObj)
          : f.url || f.preview),
      url:
        f.url ||
        (f.originFileObj ? URL.createObjectURL(f.originFileObj) : undefined),
      status: f.status || "done",
    }));
    setFiles(enrichedFileList);
    const previews = enrichedFileList
      .map((file) => {
        if (file.thumbUrl) return file.thumbUrl;
        if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
        if (file.url) return file.url;
        return null;
      })
      .filter(Boolean);
    setImagePreviews(previews);
    // Đồng bộ vào form (Upload tích hợp theo kiểu fileList array)
    form.setFieldsValue({ images: enrichedFileList });

    // Lưu thêm bản sao base64 để khôi phục file khi reload
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    (async () => {
      const base64List = [];
      for (const f of enrichedFileList) {
        if (f.originFileObj) {
          try {
            const dataUrl = await toBase64(f.originFileObj);
            base64List.push({
              name: f.name,
              type: f.originFileObj.type,
              dataUrl,
            });
          } catch (_) { }
        }
      }
      if (base64List.length > 0) {
        setImagesBase64(base64List);
        // KHÔNG lưu base64 vào sessionStorage (quá lớn → QuotaExceededError)
        // Base64 chỉ cần trong memory, không cần persist
      }
    })();
  };

  const handleRemoveImage = (file) => {
    const fileList = form.getFieldValue("images") || [];
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    form.setFieldsValue({ images: newFileList });

    const newPreviews = imagePreviews.filter(
      (_, index) => index !== fileList.indexOf(file),
    );
    setImagePreviews(newPreviews);
  };

  // Handle panorama images upload (multiple files)
  const handlePanoChange = (info) => {
    const { fileList } = info;

    // Get all file objects
    const files = fileList.map((f) => f.originFileObj || f).filter(Boolean);
    setPanoFiles(files);

    // Create previews for all files
    if (files.length === 0) {
      setPanoFiles([]);
      setPanoPreviews([]);
      return;
    }

    const previews = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews[index] = e.target.result;
          loadedCount++;
          if (loadedCount === files.length) {
            setPanoPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.thumbUrl || file.url) {
        previews[index] = file.thumbUrl || file.url;
        loadedCount++;
      }
    });

    // If all previews are loaded synchronously (no File objects)
    if (loadedCount === files.length && previews.length > 0) {
      setPanoPreviews(previews);
    }
  };

  // Thêm hàm log giá trị form
  const handleLogCurrentFormValues = () => {
    const values = form.getFieldsValue(true);
    Object.entries(values).forEach(([k, v]) => {
    });
  };

  const steps = [
    {
      title: "Hình thức",
      content: (
        <Form.Item
          name="transactionType"
          label="Nhu cầu"
          rules={[{ required: true, message: "Vui lòng chọn nhu cầu!" }]}
        >
          <Select placeholder="Chọn hình thức giao dịch">
            <Option value="Sale">Bán</Option>
            <Option value="Rent">Cho thuê</Option>
          </Select>
        </Form.Item>
      ),
    },
    {
      title: "Địa chỉ",
      content: (
        <>
          {/* Dropdown địa chỉ */}
          <div style={{ opacity: addressFromMap?.fullAddress ? 0.5 : 1 }}>
            <Form.Item
              name="city"
              label="Tỉnh/Thành phố"
              rules={[{ required: !addressFromMap?.fullAddress, message: "Vui lòng chọn tỉnh/thành phố hoặc chọn vị trí trên bản đồ!" }]}
            >
              <Select
                placeholder="Chọn tỉnh/thành phố"
                showSearch
                value={city}
                onChange={(val) => {
                  handleCityChange(val);
                  // Xóa địa chỉ từ map khi user chọn dropdown
                  if (addressFromMap) setAddressFromMap(null);
                }}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {uniqueCities.map((c) => (
                  <Option key={c.code || c.id} value={c.code || c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="district"
              label="Quận/Huyện"
              rules={[{ required: !addressFromMap?.fullAddress, message: "Vui lòng chọn quận/huyện hoặc chọn vị trí trên bản đồ!" }]}
            >
              <Select
                placeholder="Chọn quận/huyện"
                showSearch
                value={district}
                disabled={!city}
                onChange={(val) => {
                  handleDistrictChange(val);
                  if (addressFromMap) setAddressFromMap(null);
                }}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {filteredDistricts.map((d) => (
                  <Option key={d.code || d.id} value={d.code || d.id}>
                    {d.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="ward"
              label="Phường/Xã"
              rules={[{ required: !addressFromMap?.fullAddress, message: "Vui lòng chọn phường/xã hoặc chọn vị trí trên bản đồ!" }]}
            >
              <Select
                placeholder="Chọn phường/xã"
                showSearch
                value={ward}
                disabled={!district}
                onChange={(val) => {
                  handleWardChange(val);
                  if (addressFromMap) setAddressFromMap(null);
                }}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {filteredWards.map((w) => (
                  <Option key={w.code || w.id} value={w.code || w.id}>
                    {w.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="street_Name"
            label="Tên đường"
            rules={[{ required: !addressFromMap?.fullAddress, message: "Vui lòng nhập tên đường hoặc chọn vị trí trên bản đồ!" }]}
          >
            <Input
              placeholder={addressFromMap?.fullAddress ? "Không bắt buộc (đã có địa chỉ từ bản đồ)" : "Nhập tên đường"}
              value={streetName}
              onChange={handleStreetChange}
            />
          </Form.Item>
          <div style={{ margin: "24px 0" }}>
            <label
              style={{ fontWeight: 500, marginBottom: 8, display: "block" }}
            >
              📍 Chọn vị trí chính xác trên bản đồ:
            </label>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
              Bấm nút "Chấm điểm" rồi click vào bản đồ để chọn vị trí chính xác của bất động sản, 
              hoặc bấm "Vị trí của tôi" để lấy vị trí hiện tại.
            </p>
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <MapPicker
                address={mapAddress}
                latitude={latitude}
                longitude={longitude}
                zoom={zoomLevel}
                mapHeight="450px"
                editable={true}
                onLocationChange={(lat, lng, addr) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  setFullAddress(addr);
                }}
                onAddressFromMap={(parsedAddr) => {
                  // Khi user chọn vị trí trên map, lưu địa chỉ đầy đủ
                  if (parsedAddr.fullAddress) {
                    setFullAddress(parsedAddr.fullAddress);
                    setMapAddress(parsedAddr.fullAddress);
                    // Lưu địa chỉ parsed để dùng khi submit
                    setAddressFromMap(parsedAddr);
                  }
                }}
                key={`${zoomLevel}-${latitude}-${longitude}-${mapAddress}`}
              />
            </div>
          </div>
          
          {/* Hiển thị địa chỉ từ map nếu đã chọn - ở dưới cùng */}
          {addressFromMap?.fullAddress && (
            <div style={{ 
              marginTop: 16, 
              padding: '12px 16px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 8 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <strong>Địa chỉ từ bản đồ (sẽ được sử dụng)</strong>
              </div>
              <div style={{ color: '#333', wordBreak: 'break-word' }}>
                {addressFromMap.fullAddress}
              </div>
              <Button 
                type="link" 
                danger 
                size="small" 
                style={{ padding: 0, marginTop: 8 }}
                onClick={() => {
                  setAddressFromMap(null);
                  setLatitude(null);
                  setLongitude(null);
                }}
              >
                Xóa và chọn lại từ dropdown
              </Button>
            </div>
          )}
        </>
      ),
    },

    {
      title: "Thông tin",
      content: (
        <>
          <Form.Item name="phapLy" label="Giấy tờ pháp lý">
            <Select placeholder="Chọn giấy tờ pháp lý">
              <Option value="Sổ đỏ">Sổ đỏ</Option>
              <Option value="Sổ hồng">Sổ hồng</Option>
              <Option value="Hợp đồng mua bán">Hợp đồng mua bán</Option>
              <Option value="Giấy tờ khác">Giấy tờ khác</Option>
            </Select>
          </Form.Item>
          {/* <Form.Item name="noiThat" label="Nội thất">
            <Select placeholder="Chọn nội thất">
              <Option value="Đầy đủ">Đầy đủ</Option>
              <Option value="Cơ bản">Cơ bản</Option>
              <Option value="Không có">Không có</Option>
            </Select>
          </Form.Item> */}
          <Row gutter={[24, 16]} justify="space-between">
            <Col xs={24} sm={8}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: 8 }}>Số phòng ngủ</div>
                <Form.Item name="soPhongNgu" style={{ marginBottom: 0 }}>
                  <CustomNumberInput />
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: 8 }}>Số phòng tắm/WC</div>
                <Form.Item name="soPhongTam" style={{ marginBottom: 0 }}>
                  <CustomNumberInput />
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: 8 }}>Số tầng</div>
                <Form.Item name="soTang" style={{ marginBottom: 0 }}>
                  <CustomNumberInput />
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="huongNha" label="Hướng nhà">
                <Select placeholder="Chọn hướng nhà">
                  <Option value="Đông">Đông</Option>
                  <Option value="Tây">Tây</Option>
                  <Option value="Nam">Nam</Option>
                  <Option value="Bắc">Bắc</Option>
                  <Option value="Đông Bắc">Đông Bắc</Option>
                  <Option value="Tây Bắc">Tây Bắc</Option>
                  <Option value="Đông Nam">Đông Nam</Option>
                  <Option value="Tây Nam">Tây Nam</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="huongBanCong" label="Hướng ban công">
                <Select placeholder="Chọn hướng ban công">
                  <Option value="Đông">Đông</Option>
                  <Option value="Tây">Tây</Option>
                  <Option value="Nam">Nam</Option>
                  <Option value="Bắc">Bắc</Option>
                  <Option value="Đông Bắc">Đông Bắc</Option>
                  <Option value="Tây Bắc">Tây Bắc</Option>
                  <Option value="Đông Nam">Đông Nam</Option>
                  <Option value="Tây Nam">Tây Nam</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="matTien" label="Mặt tiền (m)">
                <Input type="number" min={0} placeholder="Nhập số mét" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duongVao" label="Đường vào (m)">
                <Input type="number" min={0} placeholder="Nhập số mét" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Loại BĐS"
                rules={[{ required: true, message: "Vui lòng chọn loại BĐS!" }]}
              >
                <Select placeholder="Chọn loại BĐS">
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Mức giá"
                rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Nhập mức giá"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priceUnit"
                label="Đơn vị"
                rules={[{ required: true, message: "Vui lòng chọn đơn vị!" }]}
              >
                <Select placeholder="Chọn đơn vị">
                  <Option value={PriceUnit.Triệu}>Triệu</Option>
                  <Option value={PriceUnit.Tỷ}>Tỷ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area_Size"
                label="Diện tích (m²)"
                rules={[
                  { required: true, message: "Vui lòng nhập diện tích!" },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Nhập diện tích"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: "Tiêu đề & Mô tả",
      content: (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <Button
              onClick={() => {
                setAiVisible(true);
              }}
            >
              ✨ Tạo lời với AI
            </Button>
          </div>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input
              placeholder="Nhập tiêu đề tin đăng"
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Nhập mô tả chi tiết về bất động sản"
              maxLength={3000}
              showCount
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: "Hình ảnh",
      content: (
        <>
          {/* Simplified Selection UI */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Segmented
              options={[
                {
                  label: (
                    <div style={{ padding: '4px 8px' }}>
                      <span style={{ fontSize: 16 }}>📷 Ảnh thông thường</span>
                    </div>
                  ),
                  value: 'regular',
                },
                {
                  label: (
                    <div style={{ padding: '4px 8px' }}>
                      <span style={{ fontSize: 16 }}>🌐 Tour 3D Panorama</span>
                    </div>
                  ),
                  value: 'pano',
                },
              ]}
              value={uploadMode}
              onChange={setUploadMode}
              size="large"
            />
            <div style={{ marginTop: 12, color: '#888', fontStyle: 'italic', fontSize: 13 }}>
              {uploadMode === 'regular'
                ? "Upload ảnh chụp thông thường (JPG, PNG...)"
                : "Tạo trải nghiệm thực tế ảo 360 độ chuyên nghiệp"}
            </div>
          </div>

          <div style={{ display: uploadMode === 'regular' ? 'block' : 'none' }}>
            <Form.Item
              name="images"
              // label="📷 Ảnh thông thường" // Hidden label for cleaner look
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            >
              <Upload
                listType="picture-card" // Changed to picture-card for better look
                beforeUpload={() => false}
                multiple
                isImageUrl={() => true}
                fileList={files}
                onChange={(info) => {
                  handleFileChange(info);
                  handleLogCurrentFormValues();
                }}
                onRemove={handleRemoveImage}
                locale={{ uploading: 'Đang tải...', removeFile: 'Xóa ảnh' }}
              >
                <div>
                  <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ marginTop: 8, color: '#666' }}>Thêm ảnh</div>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <div style={{ display: uploadMode === 'pano' ? 'block' : 'none' }}>
            <Form.Item
              name="panoImages"
            // label="🌐 Tour 3D - Panorama 360°"
            >
              <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setPanoEditorVisible(true)}
                  size="large"
                  style={{ marginBottom: 16, height: 50, padding: '0 30px', fontSize: 16 }}
                >
                  Mở Trình Tạo Tour 3D
                </Button>

                {(!panoTourData || !panoTourData.scenes || panoTourData.scenes.length === 0) && (
                  <div style={{ color: '#999' }}>Chưa có tour nào được tạo. Nhấn nút trên để bắt đầu.</div>
                )}

                {panoTourData && panoTourData.scenes.length > 0 && (
                  <div
                    style={{
                      marginTop: 24,
                      textAlign: 'left'
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                        borderBottom: '1px solid #eee',
                        paddingBottom: 8
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>📸 Tour đã tạo ({panoTourData.scenes.length} scenes)</strong>
                      <Button
                        type="link"
                        onClick={() => setPanoEditorVisible(true)}
                      >
                        Tiếp tục chỉnh sửa
                      </Button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {panoTourData.scenes.map((scene, idx) => (
                        <div
                          key={scene.id}
                          style={{
                            width: 120,
                            border:
                              idx === panoTourData.startupSceneIndex
                                ? "2px solid #52c41a"
                                : "1px solid #ddd",
                            borderRadius: 6,
                            overflow: "hidden",
                            position: "relative",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                          }}
                        >
                          <img
                            src={scene.preview}
                            alt={scene.name}
                            style={{
                              width: "100%",
                              height: 80,
                              objectFit: "cover",
                            }}
                          />
                          <div
                            style={{
                              textAlign: "center",
                              fontSize: "12px",
                              padding: "6px 4px",
                              background: "#fff",
                              fontWeight: 500
                            }}
                          >
                            {scene.name}
                          </div>
                          {idx === panoTourData.startupSceneIndex && (
                            <div
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "#52c41a",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 'bold'
                              }}
                            >
                              START
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </div>
        </>
      ),
    },
  ];

  const next = () => {
    // Lấy tên các trường của bước hiện tại
    const currentStepFields = React.Children.toArray(
      steps[current].content.props.children,
    )
      .map((child) => child.props && child.props.name)
      .filter(Boolean);

    // Special validation for images step (step 4, index 4)
    if (current === 4) {
      const values = form.getFieldsValue();
      const hasRegularImages = values.images && Array.isArray(values.images) && values.images.length > 0;
      const hasPanorama = panoTourData && panoTourData.scenes && panoTourData.scenes.length > 0;

      if (!hasRegularImages && !hasPanorama) {
        showMessage.error("Vui lòng thêm ít nhất 1 loại hình ảnh: Ảnh thông thường hoặc Tour 3D Panorama!");
        return;
      }
    }

    form
      .validateFields(currentStepFields)
      .then(() => {
        setCurrent(current + 1);
      })
      .catch(() => { });
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Log toàn bộ values và kiểu dữ liệu
      Object.entries(values).forEach(([k, v]) => {
      });

      // Validate: Phải có ít nhất 1 trong 2 (ảnh thông thường hoặc panorama)
      const hasRegularImages = values.images && Array.isArray(values.images) && values.images.length > 0;
      const hasPanorama = panoTourData && panoTourData.scenes && panoTourData.scenes.length > 0;

      if (!hasRegularImages && !hasPanorama) {
        showMessage.error("Vui lòng thêm ít nhất 1 loại hình ảnh: Ảnh thông thường hoặc Tour 3D Panorama!");
        setLoading(false);
        return;
      }

      // Lấy các trường số, ép kiểu an toàn
      const price = Number(values.price);
      const areaSize = Number(values.area_Size);
      const categoryId = Number(values.categoryId);
      const priceUnit = Number(values.priceUnit);

      // Validate required fields
      const hasAddressFromMap = addressFromMap?.fullAddress;
      if (
        !values.title ||
        !values.description ||
        !price ||
        !areaSize ||
        (!values.street_Name && !hasAddressFromMap) ||
        !categoryId ||
        !user?.id ||
        !values.transactionType
      ) {
        throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc");
      }
      
      // Validate địa chỉ: phải có từ map hoặc từ dropdown
      if (!hasAddressFromMap && (!values.city || !values.district || !values.ward)) {
        throw new Error("Vui lòng chọn địa chỉ từ dropdown hoặc chọn vị trí trên bản đồ");
      }
      if (isNaN(price) || price <= 0) {
        throw new Error("Mức giá không hợp lệ");
      }
      if (isNaN(areaSize) || areaSize <= 0) {
        throw new Error("Diện tích không hợp lệ");
      }
      if (isNaN(categoryId) || categoryId <= 0) {
        throw new Error("Vui lòng chọn loại bất động sản");
      }
      if (isNaN(priceUnit) || (priceUnit !== 0 && priceUnit !== 1)) {
        throw new Error("Đơn vị giá không hợp lệ");
      }
      if (!user?.id) {
        throw new Error("Vui lòng đăng nhập để đăng bài");
      }

      // Xử lý địa chỉ: ưu tiên địa chỉ từ map, nếu không có thì dùng dropdown
      let cityName, districtName, wardName, streetNameFinal;
      
      // Kiểm tra địa chỉ từ map có đầy đủ không (cần có ít nhất city)
      const hasValidMapAddress = addressFromMap?.fullAddress && addressFromMap?.city;
      
      if (hasValidMapAddress) {
        // Dùng địa chỉ từ map - parse từ fullAddress nếu thiếu thông tin
        cityName = addressFromMap.city || '';
        districtName = addressFromMap.district || '';
        wardName = addressFromMap.ward || '';
        streetNameFinal = addressFromMap.road || addressFromMap.houseNumber || values.street_Name || '';
        
        // Nếu thiếu district hoặc ward, thử parse từ fullAddress
        if (!districtName || !wardName) {
          const parts = addressFromMap.fullAddress.split(',').map(p => p.trim());
          // Nominatim thường trả về: số nhà, đường, phường, quận, thành phố, quốc gia
          if (parts.length >= 4) {
            if (!wardName) wardName = parts[parts.length - 4] || parts[0] || '';
            if (!districtName) districtName = parts[parts.length - 3] || parts[1] || '';
          }
        }
        
        
        // Nếu vẫn thiếu thông tin quan trọng, báo lỗi
        if (!cityName) {
          throw new Error("Không thể xác định địa chỉ từ vị trí đã chọn. Vui lòng chọn lại hoặc sử dụng dropdown.");
        }
      } else {
        // Dùng địa chỉ từ dropdown
        const cityObj = uniqueCities.find((c) => String(c.id) === String(values.city) || String(c.code) === String(values.city));
        const districtObj = filteredDistricts.find((d) => String(d.id) === String(values.district) || String(d.code) === String(values.district));
        const wardObj = filteredWards.find((w) => String(w.id) === String(values.ward) || String(w.code) === String(values.ward));

        if (!cityObj?.name || !districtObj?.name || !wardObj?.name) {
          throw new Error("Vui lòng chọn đầy đủ địa chỉ (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã) hoặc chọn vị trí trên bản đồ");
        }
        
        cityName = cityObj.name;
        districtName = districtObj.name;
        wardName = wardObj.name;
        streetNameFinal = values.street_Name;
      }

      const postData = new FormData();
      postData.append("Title", values.title);
      postData.append("Description", values.description);
      postData.append("Price", price);
      postData.append("PriceUnit", priceUnit);
      postData.append("Status", "dang ban");
      postData.append("Street_Name", streetNameFinal || '');
      postData.append("Area_Size", areaSize);
      postData.append("CategoryId", categoryId);
      postData.append("UserId", user.id);
      postData.append("TransactionType", values.transactionType);
      
      // Gửi tên địa chỉ trực tiếp thay vì AreaId
      // Đảm bảo không gửi giá trị trống cho các trường bắt buộc
      postData.append("CityName", cityName || "Không xác định");
      postData.append("DistrictName", districtName || "Không xác định");
      postData.append("WardName", wardName || "Không xác định");
      
      // Gửi địa chỉ đầy đủ từ map nếu có
      if (addressFromMap?.fullAddress) {
        postData.append("FullAddressFromMap", addressFromMap.fullAddress);
      }
      postData.append("SoPhongNgu", values.soPhongNgu || "");
      postData.append("SoPhongTam", values.soPhongTam || "");
      postData.append("SoTang", values.soTang || "");
      postData.append("HuongNha", values.huongNha || "");
      postData.append("HuongBanCong", values.huongBanCong || "");
      postData.append("MatTien", values.matTien || "");
      postData.append("DuongVao", values.duongVao || "");
      postData.append("PhapLy", values.phapLy || "");
      
      // Thêm tọa độ GPS nếu có
      if (latitude != null && !isNaN(latitude)) {
        postData.append("Latitude", latitude);
      }
      if (longitude != null && !isNaN(longitude)) {
        postData.append("Longitude", longitude);
      }

      // Chuẩn hóa danh sách ảnh từ form (hỗ trợ cả mảng trực tiếp và {fileList})
      const imageItems = Array.isArray(values.images)
        ? values.images
        : values.images && Array.isArray(values.images.fileList)
          ? values.images.fileList
          : [];

      // Chuyển các item thành File để upload (ưu tiên originFileObj, fallback tải từ url/thumbUrl nếu có)
      const urlToFile = async (url, nameFallback) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const name = nameFallback || `image-${Date.now()}.jpg`;
          return new File([blob], name, { type: blob.type || "image/jpeg" });
        } catch (_) {
          return null;
        }
      };

      const filesToUpload = [];
      for (const item of imageItems) {
        if (item && item.originFileObj) {
          filesToUpload.push(item.originFileObj);
        } else if (item && (item.thumbUrl || item.url)) {
          const f = await urlToFile(item.thumbUrl || item.url, item.name);
          if (f) filesToUpload.push(f);
        } else if (item && item.dataUrl) {
          // Khôi phục từ base64 khi có
          const res = await fetch(item.dataUrl);
          const blob = await res.blob();
          filesToUpload.push(
            new File([blob], item.name || `image-${Date.now()}.jpg`, {
              type: item.type || blob.type,
            }),
          );
        }
      }



      // Add regular images first
      
      filesToUpload.forEach((f) => postData.append("Images", f));

      // Add panorama tour data if available
      if (panoTourData && panoTourData.scenes.length > 0) {

        // Calculate total size
        let totalSize = 0;
        panoTourData.scenes.forEach((scene) => {
          if (scene.file && scene.file.size) {
            totalSize += scene.file.size;
          }
        });

        // Upload panorama images
        panoTourData.scenes.forEach((scene, idx) => {
          postData.append("PanoramaImages", scene.file);
        });

        // Add tour configuration as JSON
        // Calculate offset for image indexes (regular images first)
        const imageOffset = filesToUpload.length;

        const tourConfig = {
          scenes: panoTourData.scenes.map((scene, idx) => ({
            id: scene.id,
            name: scene.name,
            description: scene.description, // Fix: Include description
            imageIndex: imageOffset + idx,  // Fix: Correct index tracking
            hotspots: scene.hotspots,
            view: scene.view,
            order: idx,
          })),
          startupSceneIndex: panoTourData.startupSceneIndex,
        };
        postData.append("PanoramaTourConfig", JSON.stringify(tourConfig));

        // If no regular images, use panorama images as main images (backend requires Images field)
        if (filesToUpload.length === 0) {
          panoTourData.scenes.forEach((scene) => {
            postData.append("Images", scene.file);
          });
        }
      }

      // Log FormData contents
      for (let pair of postData.entries()) {
      }


      // Increase timeout for large panorama files (up to 2 minutes)
      const hasPanoramaData = panoTourData && panoTourData.scenes.length > 0;
      const requestTimeout = hasPanoramaData ? 300000 : 120000; // 2 minutes for panorama, 20s for regular


      const response = await axiosPrivate.post("/api/posts?role=0", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: requestTimeout,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        },
      });


      if (response.data) {
        toast.success("Bài đăng đã được tạo thành công!");
        navigate(`/chi-tiet/${response.data.id}`);
      } else {
        throw new Error("Không nhận được dữ liệu từ server");
      }
    } catch (err) {
      let backendMsg = "Đã xảy ra lỗi khi tạo bài đăng.";
      try {
        const res = err?.response;
        const data = res?.data;
        if (typeof data === "string") {
          backendMsg = data;
        } else if (data instanceof Blob) {
          const text = await data.text();
          backendMsg = text || backendMsg;
        } else if (data && typeof data === "object") {
          // Ưu tiên các trường thông báo phổ biến từ BE .NET
          backendMsg =
            data.message ||
            data.title ||
            data.detail ||
            data.error ||
            backendMsg;
        } else if (err?.message) {
          backendMsg = err.message;
        }

        // Không ghi đè thông điệp; luôn hiển thị nội dung trả về từ BE
      } catch (_) { }
      try {
        notification.error({
          message: "Không thể đăng bài",
          description: (
            <div
              style={{
                maxWidth: "96vw",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              {backendMsg}
            </div>
          ),
          key: "create-post-submit",
          placement: "top",
          duration: 8,
          style: { width: "auto" },
        });
      } catch (_) { }
      showMessage.error(backendMsg);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Bỏ spinner toàn trang khi loading

  // Phần validation trước khi submit
  const validateStep = () => {
    // Bước ảnh: chỉ cần 1 trong 2 (ảnh HOẶC panorama)
    if (current === 4) { // Bước ảnh
      if (!files || files.length === 0) {
        // Nếu không có ảnh thường, phải có panorama
        if (!panoFiles || panoFiles.length === 0) {
          showMessage.error('Vui lòng chọn ảnh hoặc panorama');
          return false;
        }
      }
      // Nếu có ít nhất 1 ảnh thường, không cần panorama
      return true;
    }
    return true;
  };

  return (
    <Card
      style={{
        maxWidth: 800,
        margin: "32px auto",
        boxShadow: "0 2px 16px #eee",
      }}
    >
      {contextHolder}

      {/* Panorama Tour Editor - Fullscreen */}
      <PanoramaTourEditor
        visible={panoEditorVisible}
        onClose={() => setPanoEditorVisible(false)}
        onSave={(tourData) => {
          setPanoTourData(tourData);
        }}
        initialData={panoTourData}
      />

      <Modal
        open={aiVisible}
        onCancel={() => setAiVisible(false)}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Tạo với AI</span>
            <Segmented
              options={[
                { label: "Lịch sự", value: "Lịch sự" },
                { label: "Trẻ trung", value: "Trẻ trung" },
              ]}
              value={aiTone}
              onChange={setAiTone}
            />
          </div>
        }
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={handleGenerateAI} loading={aiLoading}>
              Viết lại
            </Button>
            <Button
              type="primary"
              onClick={applyAiResult}
              disabled={!aiTitle && !aiDescription}
            >
              Sử dụng
            </Button>
          </div>
        }
      >
        <div
          style={{
            border: "1px dashed #9254de",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ color: "#8c8c8c", marginBottom: 8 }}>
            AI đang dựa vào dữ liệu ở các bước trước (địa chỉ, giá, diện tích,
            thông tin chi tiết) để gợi ý tiêu đề và mô tả.
          </div>
          <Button type="dashed" onClick={handleGenerateAI} loading={aiLoading}>
            AI đang viết...
          </Button>
        </div>
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Tiêu đề gợi ý">
            <Input
              value={aiTitle}
              onChange={(e) => setAiTitle(e.target.value)}
              maxLength={200}
              showCount
              placeholder="Tiêu đề do AI gợi ý"
            />
          </Form.Item>
          <Form.Item label="Mô tả gợi ý">
            <Input.TextArea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={8}
              maxLength={3000}
              showCount
              placeholder="Mô tả do AI gợi ý"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Popup tin nháp */}
      {showDraftPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "16px", color: "#1890ff" }}>
              📝 Phát hiện tin nháp!
            </h3>

            {/* Hiển thị thông tin tin nháp */}
            <div
              style={{
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <h4 style={{ marginBottom: "12px", color: "#333" }}>
                Thông tin tin nháp:
              </h4>
              <div style={{ fontSize: "14px", color: "#666" }}>
                <p>
                  <strong>Tiêu đề:</strong> {getDraftTitle()}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {getDraftAddress()}
                </p>
                <p>
                  <strong>Giá:</strong> {getDraftPrice()}
                </p>
                <p>
                  <strong>Bước hiện tại:</strong> {getDraftStep()}
                </p>
              </div>

              {/* Hiển thị hình ảnh */}
              <div style={{ marginTop: "12px" }}>
                <p>
                  <strong>Hình ảnh:</strong>
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {getDraftImages().map((image, index) => (
                    <div
                      key={index}
                      style={{
                        width: "60px",
                        height: "60px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f9f9f9",
                      }}
                    >
                      {image.thumbUrl ? (
                        <img
                          src={image.thumbUrl}
                          alt={`Ảnh ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "12px", color: "#999" }}>
                          Ảnh {index + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ marginBottom: "24px", color: "#666" }}>
              Bạn có muốn tiếp tục với tin nháp này không?
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <Button type="primary" onClick={loadDraft}>
                ✅ Tiếp tục tin nháp
              </Button>
              <Button onClick={ignoreDraft}>❌ Bỏ qua, tạo mới</Button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ textAlign: "center", marginBottom: 24 }}>Tạo tin đăng</h1>
      <Steps current={current} style={{ marginBottom: 32 }}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={async (changedValues, allValues) => {
          // Auto-save draft khi form thay đổi
          if (user?.id && Object.keys(allValues).length > 0) {
            try {
              await axiosPrivate.post("/api/posts/draft/save", {
                formData: allValues,
                currentStep: current,
              });
            } catch (error) {
              console.error("Lỗi khi auto-save draft:", error);
            }
          }
        }}
        style={{ marginTop: 24 }}
      >
        {steps.map((step, idx) => (
          <div
            key={step.title}
            style={{ display: idx === current ? "block" : "none" }}
          >
            {step.content}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 32,
          }}
        >
          {current > 0 && (
            <Button onClick={prev} style={{ minWidth: 100 }}>
              Quay lại
            </Button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Nút lưu tin nháp */}
            <Button
              type="default"
              onClick={() => saveDraft()}
              style={{ minWidth: 100 }}
            >
              💾 Lưu tin nháp
            </Button>

            {current < steps.length - 1 && (
              <Button type="primary" onClick={next} style={{ minWidth: 100 }}>
                Tiếp tục
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ minWidth: 120 }}
              >
                Đăng tin
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Card>
  );
};

const CustomNumberInput = ({ value = 0, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
    <Button
      shape="circle"
      size="middle"
      onClick={() => onChange(Math.max(0, value - 1))}
      style={{
        fontSize: 18,
        fontWeight: "bold",
        background: "#232428",
        color: "#fff",
        border: "2px solid #444",
        width: 36,
        height: 36,
        minWidth: 36,
      }}
    >
      -
    </Button>
    <span style={{ minWidth: 28, textAlign: "center", fontSize: 16, fontWeight: 500 }}>
      {value}
    </span>
    <Button
      shape="circle"
      size="middle"
      onClick={() => onChange(value + 1)}
      style={{
        fontSize: 18,
        fontWeight: "bold",
        background: "#232428",
        color: "#fff",
        border: "2px solid #444",
        width: 36,
        height: 36,
        minWidth: 36,
      }}
    >
      +
    </Button>
  </div>
);

export default CreatePostWizard;
