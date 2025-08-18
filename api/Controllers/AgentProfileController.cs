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

        [HttpGet("preview/{previewId}")]
        public IActionResult GetPreview(string previewId)
        {
            if (_cache.TryGetValue(previewId, out CreateAgentProfileDTO previewDto))
            {
                return Ok(previewDto);
            }
            return NotFound("Bản xem trước không tồn tại hoặc đã hết hạn.");
        }

        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var result = await _service.GetByUserIdAsync(userId);
            if (result == null) return NotFound();
            return Ok(result);
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