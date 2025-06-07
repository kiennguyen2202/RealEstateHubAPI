 // Price unit enum
export const PriceUnit = {
    Tỷ: 0,
    Triệu: 1
};

// Format price with appropriate unit
export const formatPrice = (price, unit) => {
    if (!price) return 'Thỏa thuận';
    
    const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);
    
    switch (unit) {
        case PriceUnit.Tỷ:
            return `${formattedPrice} tỷ`;
        case PriceUnit.Triệu:
            return `${formattedPrice} triệu`;
        default:
            return `${formattedPrice}`;
    }
};
