using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Model;

namespace api.Models
{
    public class PriceHistory
    {
        [Key]
        public int Id { get; set; }
        
        // Khu vực (City hoặc District)
        public int? CityId { get; set; }
        public int? DistrictId { get; set; }
        
        // Loại BĐS
        public int? CategoryId { get; set; }
        
        // Loại giao dịch (0: Sale, 1: Rent)
        public int TransactionType { get; set; }
        
        // Giá trung bình theo m² (triệu/m²)
        public decimal AveragePrice { get; set; }
        
        // Giá cao nhất
        public decimal HighestPrice { get; set; }
        
        // Giá thấp nhất
        public decimal LowestPrice { get; set; }
        
        // Số lượng bài đăng được tính
        public int PostCount { get; set; }
        
        // Tháng/năm thống kê
        public int Month { get; set; }
        public int Year { get; set; }
        
        // Ngày tạo record
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("CityId")]
        public virtual City? City { get; set; }
        
        [ForeignKey("DistrictId")]
        public virtual District? District { get; set; }
        
        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }
    }
}
