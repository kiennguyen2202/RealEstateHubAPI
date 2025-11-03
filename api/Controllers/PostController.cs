using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/posts")]
    
    public class PostController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<PostController> _logger;
        private readonly IMemoryCache _cache;

        public PostController(ApplicationDbContext context, IWebHostEnvironment env, ILogger<PostController> logger, IMemoryCache cache)
        {
            _context = context;
            _env = env;
            _logger = logger;
            _cache = cache;
        }
        
        private List<string> GetUserRoles() {
            return User
                .Claims
                .Where(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                .Select(c => c.Value)
                .ToList();
        }
        
        private int? GetUserId()
        {
            var userId = User
                .Claims
                .Where(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                .Select(c => c.Value)
                .FirstOrDefault();
            int id;
            if (int.TryParse(userId, out id))
            {
                return id;
            }
            else {
                return null;
            }
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetPosts(
            [FromQuery] bool? isApproved,
            [FromQuery] string? transactionType,
            [FromQuery] string? categoryType)
        {
            var posts = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Category)
                .Include(p => p.Area)
                    .ThenInclude(a => a.Ward)
                        .ThenInclude(w => w.District)
                            .ThenInclude(d => d.City)
                .Include(p => p.Images)
                .AsQueryable();

            // Filter by approval status
            if (isApproved.HasValue)
            {
                if (isApproved.Value)
                {
                    var oneDayAgo = DateTime.Now.AddDays(-1);
                    posts = posts.Where(p => p.IsApproved == true && (p.ExpiryDate == null || p.ExpiryDate > oneDayAgo));
                }
                else
                {
                    posts = posts.Where(p => p.IsApproved == false);
                }
            }
            else
            {
                posts = posts.Where(p => p.IsApproved == true &&
                    (p.ExpiryDate == null || p.ExpiryDate > DateTime.Now));
            }

            // Filter by transaction type
            if (!string.IsNullOrEmpty(transactionType))
            {
                if (Enum.TryParse<TransactionType>(transactionType, true, out var transactionTypeEnum))
                {
                    posts = posts.Where(p => p.TransactionType == transactionTypeEnum);
                }
            }

            // Filter by category type
            if (!string.IsNullOrEmpty(categoryType))
            {
                posts = posts.Where(p => p.Category.Name.ToLower().Contains(categoryType.ToLower()));
            }

            return Ok(await posts.ToListAsync());
        }
        // GET: api/posts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var post = await _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Area)
                        .ThenInclude(a => a.Ward)
                            .ThenInclude(w => w.District)
                                .ThenInclude(d => d.City)
                    .Include(p => p.User)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return NotFound();

                return Ok(post);
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết hơn trong môi trường phát triển
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/posts
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreatePostDto dto,int role)
        {
            // Enforce posting limits based on user's current role
            var currentUserId = GetUserId();
            if (currentUserId.HasValue)
            {
                var dbUser = await _context.Users.FindAsync(currentUserId.Value);
                var roleName = dbUser?.Role ?? "User";
                int limit;
                int windowDays;
                switch (roleName)
                {
                    case "Pro_1":
                        limit = 100; windowDays = 30; break;
                    case "Pro_3":
                        limit = 300; windowDays = 90; break;
                    case "Pro_12":
                        limit = 1200; windowDays = 365; break;
                    default:
                        limit = 5; windowDays = 7; break;
                }

                var cutoff = DateTime.Now.AddDays(-windowDays);
                var countInWindow = _context.Posts
                    .Where(p => p.UserId == currentUserId && p.Created >= cutoff)
                    .Count();

                if (countInWindow >= limit)
                {
                    return BadRequest($"Bạn đã đạt giới hạn {limit} bài viết trong {windowDays} ngày. Nâng cấp gói Pro để đăng nhiều hơn (Pro_1: 100/30 ngày, Pro_3: 300/90 ngày, Pro_12: 1200/365 ngày). Vào trang Membership để nâng cấp.");
                }
            }

            try
            {
                // Log received data
                _logger.LogInformation($"Received CreatePostDto: {System.Text.Json.JsonSerializer.Serialize(dto)}");

                // Validate required fields
                if (string.IsNullOrEmpty(dto.Title) || string.IsNullOrEmpty(dto.Description) || 
                    dto.Price <= 0 || dto.Area_Size <= 0 || string.IsNullOrEmpty(dto.Street_Name) || 
                    dto.CategoryId <= 0 || dto.AreaId <= 0 || dto.UserId <= 0)
                {
                    return BadRequest("All required fields must be filled with valid values");
                }

                // Parse TransactionType from string to enum
                if (!Enum.TryParse<TransactionType>(dto.TransactionType.ToString(), true, out var transactionType))
                {
                    return BadRequest($"Invalid TransactionType: {dto.TransactionType}. Must be either 'Sale' or 'Rent'");
                }

                // Verify Category exists
                var category = await _context.Categories.FindAsync(dto.CategoryId);
                if (category == null)
                {
                    return BadRequest($"Category with ID {dto.CategoryId} not found");
                }

                // Verify Ward exists and create Area
                var ward = await _context.Wards
                    .Include(w => w.District)
                    .ThenInclude(d => d.City)
                    .FirstOrDefaultAsync(w => w.Id == dto.AreaId);

                if (ward == null)
                {
                    _logger.LogWarning($"Ward with ID {dto.AreaId} not found");
                    return BadRequest($"Ward with ID {dto.AreaId} not found. Please select a valid ward.");
                }

                // Create new Area
                var area = new Area
                {
                    CityId = ward.District.CityId,
                    DistrictId = ward.DistrictId,
                    WardId = ward.Id
                };

                _context.Areas.Add(area);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created new Area with ID: {area.Id} for Ward: {ward.Id}");

                // Verify User exists
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                {
                    return BadRequest($"User with ID {dto.UserId} not found");
                }

                // Tính toán thời gian hết hạn dựa trên role
                DateTime? expiryDate = null;
                var roleNameForExpiry = user.Role ?? "User";
                expiryDate = roleNameForExpiry switch
                {
                    "Pro_1" => DateTime.Now.AddDays(30),
                    "Pro_3" => DateTime.Now.AddDays(90),
                    "Pro_12" => DateTime.Now.AddDays(365),
                    _ => DateTime.Now.AddDays(7)
                };

                var post = new Post
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Price = dto.Price,
                    TransactionType = transactionType,
                    PriceUnit = dto.PriceUnit,
                    Status = dto.Status,
                    Street_Name = dto.Street_Name,
                    Area_Size = dto.Area_Size,
                    Created = DateTime.Now,
                    CategoryId = dto.CategoryId,
                    AreaId = area.Id, 
                    UserId = GetUserId() ?? dto.UserId,
                    IsApproved = false,
                    ExpiryDate = expiryDate,
                    Images = new List<PostImage>(),
                    SoPhongNgu = dto.SoPhongNgu,
                    SoPhongTam = dto.SoPhongTam,
                    SoTang = dto.SoTang,
                    HuongNha = dto.HuongNha,
                    HuongBanCong = dto.HuongBanCong,
                    MatTien = dto.MatTien,
                    DuongVao = dto.DuongVao,
                    PhapLy = dto.PhapLy,
                    
                };

                // Log post object before saving
                _logger.LogInformation($"Created Post object: {System.Text.Json.JsonSerializer.Serialize(post)}");

                if (dto.Images != null && dto.Images.Any())
                {
                    var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    foreach (var image in dto.Images)
                    {
                        var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                        var filePath = Path.Combine(uploadsPath, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        post.Images.Add(new PostImage { Url = $"/uploads/{fileName}" });
                    }
                }

                

                _context.Posts.Add(post);
                
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogError($"Database update error: {ex.Message}");
                    _logger.LogError($"Inner exception: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
                }

                // Xóa tin nháp khi đăng tin thành công
                var userId = GetUserId();
                if (userId.HasValue)
                {
                    var draftKey = $"post_draft_{userId}";
                    _cache.Remove(draftKey);
                    _logger.LogInformation($"Đã xóa tin nháp cho user {userId} sau khi đăng tin thành công");
                }

                return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in Create post: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: api/posts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdatePostDto updateDto)
        {
            if (id != updateDto.Id)
                return BadRequest("ID không khớp.");

            var post = await _context.Posts
                .Include(p => p.Images) 
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return NotFound("Bài đăng không tìm thấy.");

            // Verify Ward exists and create Area
            var ward = await _context.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.City)
                .FirstOrDefaultAsync(w => w.Id == updateDto.AreaId);

            if (ward == null)
            {
                _logger.LogWarning($"Ward with ID {updateDto.AreaId} not found");
                return BadRequest($"Ward with ID {updateDto.AreaId} not found. Please select a valid ward.");
            }

            // Create new Area
            var area = new Area
            {
                CityId = ward.District.CityId,
                DistrictId = ward.DistrictId,
                WardId = ward.Id
            };

            _context.Areas.Add(area);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Created new Area with ID: {area.Id} for Ward: {ward.Id}");
           
            post.Title = updateDto.Title;
            post.Description = updateDto.Description;
            post.Price = updateDto.Price;
            post.PriceUnit = updateDto.PriceUnit;
            post.TransactionType = updateDto.TransactionType;
            post.Status = updateDto.Status; 
            post.Street_Name = updateDto.Street_Name;
            post.Area_Size = updateDto.Area_Size;
            post.CategoryId = updateDto.CategoryId;
            post.AreaId = area.Id;
            post.SoPhongNgu = updateDto.SoPhongNgu;
            post.SoPhongTam = updateDto.SoPhongTam;
            post.SoTang = updateDto.SoTang;
            post.HuongNha = updateDto.HuongNha;
            post.HuongBanCong = updateDto.HuongBanCong;
            post.MatTien = updateDto.MatTien;
            post.DuongVao = updateDto.DuongVao;
            post.PhapLy = updateDto.PhapLy;
            

            // Handle new images
            if (updateDto.Images != null && updateDto.Images.Any())
            {
                var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                foreach (var image in updateDto.Images)
                {
                    // Generate unique file name
                    var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    post.Images.Add(new PostImage { Url = $"/uploads/{fileName}" });
                }
            }


            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/posts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var post = await _context.Posts
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (post == null)
                return NotFound();

            _context.PostImages.RemoveRange(post.Images);
            _context.Posts.Remove(post);

            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Post>>> SearchPosts(

            [FromQuery] int? categoryId,
            [FromQuery] string status,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] decimal? minArea,
            [FromQuery] decimal? maxArea,
            [FromQuery] int? cityId,
            [FromQuery] int? districtId,
            [FromQuery] int? wardId,
            [FromQuery] string q)
        {
            try
            {
                var query = _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Area)

                    .Include(p => p.User)
                    .AsQueryable();

                // Apply filters
                if (categoryId.HasValue)
                    query = query.Where(p => p.CategoryId == categoryId);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(p => p.Status == status);

                if (minPrice.HasValue)
                    query = query.Where(p => p.Price >= minPrice);

                if (maxPrice.HasValue)
                    query = query.Where(p => p.Price <= maxPrice);

                if (minArea.HasValue)
                    query = query.Where(p => p.Area_Size >= (float)minArea);

                if (maxArea.HasValue)
                    query = query.Where(p => p.Area_Size <= (float)maxArea);



                if (!string.IsNullOrEmpty(q))
                {
                    query = query.Where(p =>
                        p.Title.Contains(q) ||
                        p.Description.Contains(q) ||
                        p.Street_Name.Contains(q)
                    );
                }

                var posts = await query.ToListAsync();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [HttpGet("user/{userId}")]
         public async Task<IActionResult> GetPostsByUser(int userId)
         {
              var posts = await _context.Posts          
              .Include(p => p.Images)
              .Include(p => p.Category)
              .Include(p => p.User)

              .Include(p => p.Area)
                .ThenInclude(a => a.Ward)
                    .ThenInclude(w => w.District)
                        .ThenInclude(d => d.City)
              .Where(p => p.UserId == userId)

              .OrderByDescending(p => p.Created)
              .ToListAsync();
               return Ok(posts);
         }

        
        
        // Lưu tin nháp vào session
        [Authorize]
        [HttpPost("draft/save")]
        public async Task<IActionResult> SaveDraft([FromBody] SaveDraftDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Không tìm thấy thông tin người dùng.");
                }

                var draftKey = $"post_draft_{userId}";
                var draftData = new DraftPostData
                {
                    UserId = userId.Value,
                    FormData = dto.FormData,
                    CurrentStep = dto.CurrentStep,
                    CreatedAt = DateTime.Now,
                    LastModified = DateTime.Now
                };

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromDays(7)); // Tin nháp tồn tại 7 ngày

                _cache.Set(draftKey, draftData, cacheEntryOptions);

                _logger.LogInformation($"Đã lưu tin nháp cho user {userId}");

                return Ok(new { 
                    message = "Đã lưu tin nháp thành công",
                    draftId = draftKey,
                    lastModified = draftData.LastModified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lưu tin nháp: {ex.Message}");
                return StatusCode(500, "Lỗi khi lưu tin nháp");
            }
        }

        // Lấy tin nháp từ session
        [Authorize]
        [HttpGet("draft")]
        public async Task<IActionResult> GetDraft()
        {
            try
            {
                var userId = GetUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Không tìm thấy thông tin người dùng.");
                }

                var draftKey = $"post_draft_{userId}";
                if (_cache.TryGetValue(draftKey, out DraftPostData draftData))
                {
                    return Ok(new
                    {
                        hasDraft = true,
                        formData = draftData.FormData,
                        currentStep = draftData.CurrentStep,
                        createdAt = draftData.CreatedAt,
                        lastModified = draftData.LastModified
                    });
                }

                return Ok(new { hasDraft = false });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy tin nháp: {ex.Message}");
                return StatusCode(500, "Lỗi khi lấy tin nháp");
            }
        }

        // Xóa tin nháp
        [Authorize]
        [HttpDelete("draft")]
        public async Task<IActionResult> DeleteDraft()
        {
            try
            {
                var userId = GetUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Không tìm thấy thông tin người dùng.");
                }

                var draftKey = $"post_draft_{userId}";
                _cache.Remove(draftKey);

                _logger.LogInformation($"Đã xóa tin nháp cho user {userId}");

                return Ok(new { message = "Đã xóa tin nháp thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi xóa tin nháp: {ex.Message}");
                return StatusCode(500, "Lỗi khi xóa tin nháp");
            }
        }

        // Cập nhật tin nháp
        [Authorize]
        [HttpPut("draft")]
        public async Task<IActionResult> UpdateDraft([FromBody] SaveDraftDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Không tìm thấy thông tin người dùng.");
                }

                var draftKey = $"post_draft_{userId}";
                if (_cache.TryGetValue(draftKey, out DraftPostData existingDraft))
                {
                    existingDraft.FormData = dto.FormData;
                    existingDraft.CurrentStep = dto.CurrentStep;
                    existingDraft.LastModified = DateTime.Now;

                    var cacheEntryOptions = new MemoryCacheEntryOptions()
                        .SetSlidingExpiration(TimeSpan.FromDays(7));

                    _cache.Set(draftKey, existingDraft, cacheEntryOptions);

                    _logger.LogInformation($"Đã cập nhật tin nháp cho user {userId}");

                    return Ok(new { 
                        message = "Đã cập nhật tin nháp thành công",
                        lastModified = existingDraft.LastModified
                    });
                }

                return NotFound("Không tìm thấy tin nháp để cập nhật");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi cập nhật tin nháp: {ex.Message}");
                return StatusCode(500, "Lỗi khi cập nhật tin nháp");
            }
        }
        



    }

    
}