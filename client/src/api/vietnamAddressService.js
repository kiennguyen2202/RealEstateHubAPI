/**
 * Vietnam Address Service
 * Dữ liệu địa chỉ Việt Nam offline (63 tỉnh/thành phố)
 * Fallback khi API không khả dụng
 */

// Dữ liệu 63 tỉnh/thành phố Việt Nam
const PROVINCES_DATA = [
  { code: "01", name: "Thành phố Hà Nội" },
  { code: "02", name: "Tỉnh Hà Giang" },
  { code: "04", name: "Tỉnh Cao Bằng" },
  { code: "06", name: "Tỉnh Bắc Kạn" },
  { code: "08", name: "Tỉnh Tuyên Quang" },
  { code: "10", name: "Tỉnh Lào Cai" },
  { code: "11", name: "Tỉnh Điện Biên" },
  { code: "12", name: "Tỉnh Lai Châu" },
  { code: "14", name: "Tỉnh Sơn La" },
  { code: "15", name: "Tỉnh Yên Bái" },
  { code: "17", name: "Tỉnh Hoà Bình" },
  { code: "19", name: "Tỉnh Thái Nguyên" },
  { code: "20", name: "Tỉnh Lạng Sơn" },
  { code: "22", name: "Tỉnh Quảng Ninh" },
  { code: "24", name: "Tỉnh Bắc Giang" },
  { code: "25", name: "Tỉnh Phú Thọ" },
  { code: "26", name: "Tỉnh Vĩnh Phúc" },
  { code: "27", name: "Tỉnh Bắc Ninh" },
  { code: "30", name: "Tỉnh Hải Dương" },
  { code: "31", name: "Thành phố Hải Phòng" },
  { code: "33", name: "Tỉnh Hưng Yên" },
  { code: "34", name: "Tỉnh Thái Bình" },
  { code: "35", name: "Tỉnh Hà Nam" },
  { code: "36", name: "Tỉnh Nam Định" },
  { code: "37", name: "Tỉnh Ninh Bình" },
  { code: "38", name: "Tỉnh Thanh Hóa" },
  { code: "40", name: "Tỉnh Nghệ An" },
  { code: "42", name: "Tỉnh Hà Tĩnh" },
  { code: "44", name: "Tỉnh Quảng Bình" },
  { code: "45", name: "Tỉnh Quảng Trị" },
  { code: "46", name: "Tỉnh Thừa Thiên Huế" },
  { code: "48", name: "Thành phố Đà Nẵng" },
  { code: "49", name: "Tỉnh Quảng Nam" },
  { code: "51", name: "Tỉnh Quảng Ngãi" },
  { code: "52", name: "Tỉnh Bình Định" },
  { code: "54", name: "Tỉnh Phú Yên" },
  { code: "56", name: "Tỉnh Khánh Hòa" },
  { code: "58", name: "Tỉnh Ninh Thuận" },
  { code: "60", name: "Tỉnh Bình Thuận" },
  { code: "62", name: "Tỉnh Kon Tum" },
  { code: "64", name: "Tỉnh Gia Lai" },
  { code: "66", name: "Tỉnh Đắk Lắk" },
  { code: "67", name: "Tỉnh Đắk Nông" },
  { code: "68", name: "Tỉnh Lâm Đồng" },
  { code: "70", name: "Tỉnh Bình Phước" },
  { code: "72", name: "Tỉnh Tây Ninh" },
  { code: "74", name: "Tỉnh Bình Dương" },
  { code: "75", name: "Tỉnh Đồng Nai" },
  { code: "77", name: "Tỉnh Bà Rịa - Vũng Tàu" },
  { code: "79", name: "Thành phố Hồ Chí Minh" },
  { code: "80", name: "Tỉnh Long An" },
  { code: "82", name: "Tỉnh Tiền Giang" },
  { code: "83", name: "Tỉnh Bến Tre" },
  { code: "84", name: "Tỉnh Trà Vinh" },
  { code: "86", name: "Tỉnh Vĩnh Long" },
  { code: "87", name: "Tỉnh Đồng Tháp" },
  { code: "89", name: "Tỉnh An Giang" },
  { code: "91", name: "Tỉnh Kiên Giang" },
  { code: "92", name: "Thành phố Cần Thơ" },
  { code: "93", name: "Tỉnh Hậu Giang" },
  { code: "94", name: "Tỉnh Sóc Trăng" },
  { code: "95", name: "Tỉnh Bạc Liêu" },
  { code: "96", name: "Tỉnh Cà Mau" },
];

// Cache
let provincesCache = null;
let districtsCache = {};
let wardsCache = {};

// API URLs để thử
const API_URLS = [
  'https://esgoo.net/api-tinhthanh',
];

/**
 * Lấy danh sách tỉnh/thành phố
 */
export const getProvinces = async () => {
  if (provincesCache) {
    return provincesCache;
  }

  // Thử API esgoo.net
  try {
    const response = await fetch(`${API_URLS[0]}/1/0.htm`);
    if (response.ok) {
      const data = await response.json();
      if (data.error === 0 && data.data) {
        provincesCache = data.data.map(p => ({
          code: p.id,
          name: p.full_name || p.name,
        }));
        console.log('✅ Loaded provinces from API');
        return provincesCache;
      }
    }
  } catch (error) {
    console.warn('API failed, using offline data:', error.message);
  }

  // Fallback: dùng dữ liệu offline
  console.log('📦 Using offline provinces data');
  provincesCache = PROVINCES_DATA;
  return provincesCache;
};

/**
 * Lấy danh sách quận/huyện theo mã tỉnh/thành phố
 */
export const getDistrictsByProvince = async (provinceCode) => {
  if (!provinceCode) return [];
  
  if (districtsCache[provinceCode]) {
    return districtsCache[provinceCode];
  }

  // Thử API
  try {
    const response = await fetch(`${API_URLS[0]}/2/${provinceCode}.htm`);
    if (response.ok) {
      const data = await response.json();
      if (data.error === 0 && data.data) {
        const districts = data.data.map(d => ({
          code: d.id,
          name: d.full_name || d.name,
          province_code: provinceCode
        }));
        districtsCache[provinceCode] = districts;
        return districts;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch districts:', error.message);
  }

  return [];
};

/**
 * Lấy danh sách phường/xã theo mã quận/huyện
 */
export const getWardsByDistrict = async (districtCode) => {
  if (!districtCode) return [];
  
  if (wardsCache[districtCode]) {
    return wardsCache[districtCode];
  }

  // Thử API
  try {
    const response = await fetch(`${API_URLS[0]}/3/${districtCode}.htm`);
    if (response.ok) {
      const data = await response.json();
      if (data.error === 0 && data.data) {
        const wards = data.data.map(w => ({
          code: w.id,
          name: w.full_name || w.name,
          district_code: districtCode
        }));
        wardsCache[districtCode] = wards;
        return wards;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch wards:', error.message);
  }

  return [];
};

/**
 * Tìm kiếm địa chỉ theo tên
 */
export const searchAddress = async (query) => {
  if (!query || query.length < 2) return [];
  
  // Tìm trong provinces offline
  const lowerQuery = query.toLowerCase();
  return PROVINCES_DATA.filter(p => 
    p.name.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Clear cache
 */
export const clearCache = () => {
  provincesCache = null;
  districtsCache = {};
  wardsCache = {};
};

export default {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  searchAddress,
  clearCache
};
