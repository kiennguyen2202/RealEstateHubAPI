// Định nghĩa enum PriceUnit 
export const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

// Helper function để format giá
export const formatPrice = (price, unit) => {
  if (!price || price === 0) return 'Thỏa thuận';

  if (unit === PriceUnit.Tỷ) {
    return `${price} Tỷ`;
  } else if (unit === PriceUnit.Triệu) {
    return `${price} Triệu`;
  }

  // Nếu không có đơn vị thì fallback về định dạng theo giá trị VND
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)} Tỷ`;
  }
  return `${(price / 1_000_000).toFixed(0)} Triệu`;
}; 