using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            // Kiểm tra xem đã có dữ liệu Category chưa
            if (context.Categories.Any())
            {
                return;   // DB đã có dữ liệu
            }

            var categories = new Category[]
            {
                new Category
                {
                    Name = "Căn hộ chung cư",
                    Description = "Các căn hộ trong tòa nhà chung cư, có nhiều tiện ích như hồ bơi, gym, khu vui chơi...",
                    Icon = "apartment",
                    IsActive = true
                },
                new Category
                {
                    Name = "Nhà riêng",
                    Description = "Nhà ở riêng biệt, có sân vườn, không gian riêng tư, phù hợp cho gia đình...",
                    Icon = "house",
                    IsActive = true
                },
                new Category
                {
                    Name = "Biệt thự",
                    Description = "Nhà ở cao cấp, có diện tích lớn, thiết kế sang trọng, thường có sân vườn riêng...",
                    Icon = "villa",
                    IsActive = true
                },
                new Category
                {
                    Name = "Đất nền",
                    Description = "Các lô đất trống, chưa xây dựng, phù hợp cho đầu tư hoặc xây dựng...",
                    Icon = "land",
                    IsActive = true
                },
                new Category
                {
                    Name = "Văn phòng",
                    Description = "Không gian làm việc chuyên nghiệp, có đầy đủ tiện ích văn phòng...",
                    Icon = "office",
                    IsActive = true
                },
                new Category
                {
                    Name = "Mặt bằng kinh doanh",
                    Description = "Không gian thương mại, phù hợp cho mở cửa hàng, nhà hàng, quán cafe...",
                    Icon = "shop",
                    IsActive = true
                }
            };

            context.Categories.AddRange(categories);
            context.SaveChanges();
        }
    }
} 