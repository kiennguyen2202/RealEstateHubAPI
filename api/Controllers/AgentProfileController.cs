using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using RealEstateHubAPI.Services;
using RealEstateHubAPI.DTOs;
using Microsoft.AspNetCore.Http;
using System.IO;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using System;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Hosting;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/agent-profile")]
    public class AgentProfileController : ControllerBase
    {
        private readonly IAgentProfileService _service;
        private readonly IMemoryCache _cache;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IPostService _postService;
        private readonly ApplicationDbContext _context;

        public AgentProfileController(ApplicationDbContext context,IAgentProfileService service, IMemoryCache cache, IWebHostEnvironment webHostEnvironment, IPostService postService)
        {
            _service = service;
            _cache = cache;
            _webHostEnvironment = webHostEnvironment;
            _postService = postService;
            _context = context; 
        }
        [HttpGet("{id}/posts")]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetAgentPosts(int id)
        {
            try
            {
                // Gọi service để lấy danh sách bài đăng
                var posts = await _postService.GetPostsByAgentProfileIdAsync(id);

                if (posts == null || !posts.Any())
                {
                   
                    return Ok(new List<PostDto>()); 
                }

                return Ok(posts);
            }
            catch (Exception ex)
            {
                
                return StatusCode(StatusCodes.Status500InternalServerError, $"Internal server error: {ex.Message}");
            }
        }        
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var result = await _service.GetBySlugAsync(slug);
            if (result == null) return NotFound();
            return Ok(result);
        }
        [Authorize]
        [HttpPost("preview")]
        public async Task<IActionResult> CreatePreview([FromForm] CreateAgentProfileDTO dto)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng.");
            }
            try
            {
                // 1. Xử lý upload file vào thư mục tạm
                var avatarFile = Request.Form.Files["AvatarUrl"];
                var bannerFile = Request.Form.Files["BannerUrl"];

                string avatarUrl = null;
                string bannerUrl = null;

                if (avatarFile != null && avatarFile.Length > 0)
                {
                    avatarUrl = await SaveFileAsync(avatarFile, "uploads/temp/avatars");
                }
                if (bannerFile != null && bannerFile.Length > 0)
                {
                    bannerUrl = await SaveFileAsync(bannerFile, "uploads/temp/banners");
                }

                // 2. Tạo DTO với đường dẫn file tạm
                var previewDto = new CreateAgentProfileDTO
                {
                    UserId = currentUserId,
                    ShopName = dto.ShopName,
                    Description = dto.Description,
                    Address = dto.Address,
                    Slug = dto.Slug,
                    AreaIds = dto.AreaIds,
                    CategoryIds = dto.CategoryIds,
                    TransactionTypes = dto.TransactionTypes,
                    PhoneNumber = dto.PhoneNumber,
                    AvatarUrl = avatarUrl, 
                    BannerUrl = bannerUrl 
                };

                // 3. Lưu DTO vào cache với một ID duy nhất
                var previewId = Guid.NewGuid().ToString();
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromMinutes(30)); // Dữ liệu sẽ bị xóa sau 30 phút không hoạt động

                _cache.Set(previewId, previewDto, cacheEntryOptions);

                // 4. Trả về previewId cho frontend
                return Ok(new { previewId = previewId });
            }
            catch (Exception ex)
            {
                // Xóa file tạm nếu có lỗi
                
                return BadRequest($"Lỗi khi tạo bản xem trước: {ex.Message}");
            }
        }

        [HttpPost("commit/{previewId}")]
        public async Task<IActionResult> CommitProfile(string previewId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng.");
            }
            
            Console.WriteLine($"CommitProfile - previewId: {previewId}");
            Console.WriteLine($"CommitProfile - currentUserId: {currentUserId}");
            
            if (!_cache.TryGetValue(previewId, out CreateAgentProfileDTO dtoToCommit))
            {
                Console.WriteLine($"CommitProfile - Cache miss for previewId: {previewId}");
                return NotFound("Không tìm thấy dữ liệu xem trước hoặc đã hết hạn.");
            }

            Console.WriteLine($"CommitProfile - Found dto in cache:");
            Console.WriteLine($"  UserId: {dtoToCommit.UserId}");
            Console.WriteLine($"  ShopName: {dtoToCommit.ShopName}");
            Console.WriteLine($"  AreaIds: {string.Join(", ", dtoToCommit.AreaIds ?? new List<int>())}");
            Console.WriteLine($"  CategoryIds: {string.Join(", ", dtoToCommit.CategoryIds ?? new List<int>())}");
            Console.WriteLine($"  TransactionTypes: {string.Join(", ", dtoToCommit.TransactionTypes ?? new List<string>())}");

            if (dtoToCommit.UserId != currentUserId)
            {
                Console.WriteLine($"CommitProfile - User mismatch: {dtoToCommit.UserId} != {currentUserId}");
                return Forbid("Bạn không có quyền xác nhận hồ sơ này.");
            }

            // Validation cho các trường bắt buộc
            if (dtoToCommit.AreaIds == null || !dtoToCommit.AreaIds.Any())
            {
                Console.WriteLine("CommitProfile - Validation failed: AreaIds is null or empty");
                return BadRequest("Vui lòng chọn ít nhất một khu vực hoạt động.");
            }

            if (dtoToCommit.CategoryIds == null || !dtoToCommit.CategoryIds.Any())
            {
                Console.WriteLine("CommitProfile - Validation failed: CategoryIds is null or empty");
                return BadRequest("Vui lòng chọn ít nhất một loại hình bất động sản.");
            }

            if (dtoToCommit.TransactionTypes == null || !dtoToCommit.TransactionTypes.Any())
            {
                Console.WriteLine("CommitProfile - Validation failed: TransactionTypes is null or empty");
                return BadRequest("Vui lòng chọn ít nhất một loại giao dịch.");
            }

            try
            {
                Console.WriteLine("CommitProfile - Starting file move operations");
                // Di chuyển file từ thư mục tạm sang thư mục chính thức
                dtoToCommit.AvatarUrl = MoveFileToPermanentLocation(dtoToCommit.AvatarUrl, "avatars");
                dtoToCommit.BannerUrl = MoveFileToPermanentLocation(dtoToCommit.BannerUrl, "banners");
                Console.WriteLine($"CommitProfile - Files moved: Avatar={dtoToCommit.AvatarUrl}, Banner={dtoToCommit.BannerUrl}");

                Console.WriteLine("CommitProfile - Calling service.CreateAsync");
                // Gọi service để tạo profile trong DB với dữ liệu đã được xử lý
                var result = await _service.CreateAsync(dtoToCommit);
                Console.WriteLine($"CommitProfile - Service result: {result?.Id}");

                // Xóa dữ liệu khỏi cache sau khi commit thành công
                _cache.Remove(previewId);
                Console.WriteLine("CommitProfile - Cache entry removed");

                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CommitProfile - Exception: {ex.Message}");
                Console.WriteLine($"CommitProfile - Stack trace: {ex.StackTrace}");
                return BadRequest($"Lỗi khi lưu agent profile: {ex.Message}");
            }
        }

        private string? MoveFileToPermanentLocation(string? temporaryRelativePath, string targetFolder)
        {
            if (string.IsNullOrEmpty(temporaryRelativePath))
            {
                return null;
            }

            // temporaryRelativePath sẽ có dạng "/uploads/temp/avatars/filename.jpg"
           
            var fileName = Path.GetFileName(temporaryRelativePath);

            // Xây dựng đường dẫn vật lý đầy đủ của file tạm thời
            var tempFilePath = Path.Combine(_webHostEnvironment.WebRootPath, temporaryRelativePath.TrimStart('/'));

            // Xây dựng đường dẫn vật lý đầy đủ của thư mục đích
            var permanentFolderPath = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", targetFolder);

            // Tạo thư mục đích nếu nó chưa tồn tại
            if (!Directory.Exists(permanentFolderPath))
            {
                Directory.CreateDirectory(permanentFolderPath);
            }

            // Xây dựng đường dẫn vật lý đầy đủ của file đích
            var permanentFilePath = Path.Combine(permanentFolderPath, fileName);

            try
            {
                // Kiểm tra xem file tạm có tồn tại không trước khi di chuyển
                if (System.IO.File.Exists(tempFilePath))
                {
                    // Di chuyển file
                    System.IO.File.Move(tempFilePath, permanentFilePath, true); // true để ghi đè nếu file đã tồn tại

                    // Trả về đường dẫn tương đối mới cho file
                    return $"/uploads/{targetFolder}/{fileName}";
                }
                else
                {
                    // File tạm không tồn tại, có thể log lỗi hoặc trả về null/đường dẫn cũ
                    Console.WriteLine($"Cảnh báo: File tạm thời không tồn tại: {tempFilePath}");
                    return temporaryRelativePath; // Giữ lại đường dẫn tạm thời nếu không tìm thấy file
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nếu có vấn đề khi di chuyển file
                Console.Error.WriteLine($"Lỗi khi di chuyển file '{tempFilePath}' đến '{permanentFilePath}': {ex.Message}");
                throw; // Ném lại exception để hàm gọi biết có lỗi
            }
        }



        [HttpGet("preview/{previewId}")]
        public IActionResult GetPreview(string previewId)
        {
            if (_cache.TryGetValue(previewId, out CreateAgentProfileDTO previewDto))
            {
                return Ok(previewDto);
            }
            return NotFound("Bản xem trước không tồn tại hoặc đã hết hạn.");
        }

       

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAgentProfile(int id, [FromBody] UpdateAgentProfileDTO dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAgentProfile(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
        private async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0) return null;

            var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, subFolder);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/{subFolder}/{uniqueFileName}".Replace("\\", "/"); // Trả về đường dẫn tương đối để lưu vào DB/Cache
        }
    }
} 