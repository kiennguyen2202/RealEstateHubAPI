// Price unit enum
export const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

// Format price with appropriate unit
export const formatPrice = (price, unit) => {
    if (!price) return 'Thỏa thuận';
    
    // Convert price to string and add thousand separators
    const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    switch (unit) {
        case PriceUnit.Tỷ:
            return `${formattedPrice} Tỷ`;
        case PriceUnit.Triệu:
            return `${formattedPrice} Triệu`;
        default:
            return `${formattedPrice}`;
    }
};

export const toTrieu = (price, unit) => {
  // unit: 0 = tỷ, 1 = triệu
  if (unit === 0) return price * 1000;
  return price;
};
