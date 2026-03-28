using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Random _random = new Random();

        public SeedDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("init-data")]
        public async Task<ActionResult> InitData()
        {
            try 
            {
                // 1. Seed Admin
                if (!await _context.Users.AnyAsync(u => u.Email == "admin@gmail.com"))
                {
                    _context.Users.Add(new User
                    {
                        Name = "Admin Quản Trị",
                        Phone = "0987654321",
                        Email = "admin@gmail.com",
                        Password = "admin123", 
                        Role = "Admin",
                        IsLocked = false
                    });
                }
                // 2. Seed User
                if (!await _context.Users.AnyAsync(u => u.Email == "user@gmail.com"))
                {
                    _context.Users.Add(new User
                    {
                        Name = "User",
                        Phone = "0987654321",
                        Email = "user@gmail.com",
                        Password = "user123", 
                        Role = "User",
                        IsLocked = false
                    });
                }

                // 2. Seed Categories
                var categories = new[]
                {
                    new Category { Name = "Căn hộ chung cư", Description = "Căn hộ", Icon = "home", IsActive = true },
                    new Category { Name = "Nhà riêng", Description = "Nhà riêng", Icon = "home", IsActive = true },
                    new Category { Name = "Nhà biệt thự, liền kề", Description = "Biệt thự", Icon = "home", IsActive = true },
                    new Category { Name = "Nhà mặt phố", Description = "Nhà mặt phố", Icon = "home", IsActive = true },
                    new Category { Name = "Đất nền dự án", Description = "Đất nền", Icon = "home", IsActive = true },
                    new Category { Name = "Bán đất", Description = "Đất", Icon = "home", IsActive = true }
                };

                foreach (var cat in categories)
                {
                    if (!await _context.Categories.AnyAsync(c => c.Name == cat.Name))
                    {
                        _context.Categories.Add(cat);
                    }
                }

                // 3. Seed 1 Basic Area for Create Wizard
                if (!await _context.Cities.AnyAsync())
                {
                    var city = new City { Name = "Hồ Chí Minh" };
                    _context.Cities.Add(city);
                    await _context.SaveChangesAsync(); // save to get ID
                    
                    var district = new District { Name = "Quận 1", CityId = city.Id };
                    _context.Districts.Add(district);
                    await _context.SaveChangesAsync(); 

                    var ward = new Ward { Name = "Phường Bến Nghé", DistrictId = district.Id };
                    _context.Wards.Add(ward);
                    await _context.SaveChangesAsync(); 

                    _context.Areas.Add(new Area { CityId = city.Id, DistrictId = district.Id, WardId = ward.Id, Longitude = 106.7009f, Latitude = 10.7769f });
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Khởi tạo dữ liệu Admin (admin@gmail.com/admin), Loại BĐS, và Khu Vực mẫu thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Lỗi: {ex.Message} - {ex.InnerException?.Message}");
            }
        }

        [HttpPost("generate-posts")]
        public async Task<ActionResult> GeneratePosts([FromQuery] int count = 60)
        {
            var titles = new[]
            {
                "Bán căn hộ 2PN 2WC chung cư cao cấp view sông",
                "Nhà phố 3 tầng mới xây full nội thất",
                "Bán gấp nhà hẻm xe hơi giá tốt nhất khu vực",
                "Căn hộ penthouse view toàn cảnh thành phố",
                "Đất nền sổ đỏ chính chủ thổ cư 100%",
                "Bán nhà mặt tiền đường lớn kinh doanh tốt",
                "Căn hộ studio tiện nghi phù hợp đầu tư",
                "Nhà riêng sổ hồng chính chủ pháp lý rõ ràng",
                "Bán đất góc 2 mặt tiền vị trí đẹp",
                "Căn hộ 3PN rộng rãi tầng cao view đẹp"
            };

            var streets = new[]
            {
                "Nguyễn Văn Linh", "Lê Văn Việt", "Võ Văn Ngân", "Phạm Văn Đồng",
                "Nguyễn Thị Minh Khai", "Trần Hưng Đạo", "Lý Thường Kiệt", "Hai Bà Trưng",
                "Điện Biên Phủ", "Cách Mạng Tháng 8", "Nguyễn Huệ", "Lê Lợi",
                "Pasteur", "Nam Kỳ Khởi Nghĩa", "Nguyễn Đình Chiểu", "Võ Thị Sáu",
                "Phan Xích Long", "Hoàng Văn Thụ", "Cộng Hòa", "Trường Chinh"
            };

            var descriptions = new[]
            {
                "Vị trí đẹp, giá tốt, pháp lý rõ ràng. Liên hệ ngay để xem nhà.",
                "Căn hộ cao cấp với đầy đủ tiện ích, an ninh 24/7.",
                "Nhà mới xây, thiết kế hiện đại, view thoáng mát.",
                "Đất nền dự án hạ tầng hoàn thiện, sổ đỏ chính chủ.",
                "Khu dân cư yên tĩnh, gần trường học, bệnh viện, chợ."
            };

            var areas = await _context.Areas.Take(30).ToListAsync();
            var categories = await _context.Categories.ToListAsync();
            
            if (!areas.Any() || !categories.Any())
                return BadRequest("Không có dữ liệu Areas hoặc Categories");

            var posts = new List<Post>();
            var baseDate = DateTime.Now;

            for (int i = 0; i < count; i++)
            {
                var monthOffset = i / 5; // 5 bài mỗi tháng
                var created = baseDate.AddMonths(-monthOffset).AddDays(-_random.Next(1, 28));
                var category = categories[_random.Next(categories.Count)];
                var area = areas[_random.Next(areas.Count)];
                var transactionType = i % 4 == 0 ? TransactionType.Rent : TransactionType.Sale;
                
                decimal price;
                PriceUnit priceUnit;
                
                if (transactionType == TransactionType.Sale)
                {
                    price = 2 + (decimal)(_random.NextDouble() * 13); // 2-15 tỷ
                    priceUnit = PriceUnit.Tỷ;
                }
                else
                {
                    price = 5 + (decimal)(_random.NextDouble() * 45); // 5-50 triệu
                    priceUnit = PriceUnit.Triệu;
                }

                posts.Add(new Post
                {
                    Title = titles[_random.Next(titles.Length)],
                    Description = descriptions[_random.Next(descriptions.Length)],
                    Price = Math.Round(price, 2),
                    PriceUnit = priceUnit,
                    TransactionType = transactionType,
                    Status = "active",
                    Created = created,
                    Area_Size = 50 + _random.Next(151), // 50-200 m²
                    Street_Name = streets[_random.Next(streets.Length)],
                    UserId = 11,
                    CategoryId = category.Id,
                    AreaId = area.Id,
                    IsApproved = true,
                    ExpiryDate = created.AddMonths(3)
                });
            }

            await _context.Posts.AddRangeAsync(posts);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Đã tạo {count} bài đăng mẫu thành công!",
                posts = posts.Select(p => new { p.Id, p.Title, p.Price, p.PriceUnit, p.Created })
            });
        }

        [HttpDelete("delete-sample-posts")]
        public async Task<ActionResult> DeleteSamplePosts([FromQuery] int fromId = 268)
        {
            var posts = await _context.Posts.Where(p => p.Id >= fromId).ToListAsync();
            _context.Posts.RemoveRange(posts);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã xóa {posts.Count} bài đăng" });
        }
    }
}
