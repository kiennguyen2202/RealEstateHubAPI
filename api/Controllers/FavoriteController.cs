using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using System.Security.Claims;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/favorites")]
    [ApiController]
    public class FavoriteController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FavoriteController> _logger;

        public FavoriteController(ApplicationDbContext context, ILogger<FavoriteController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Lấy danh sách bài post yêu thích của user
        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFavoritesByUser(int userId)
        {
            try
            {
                var favorites = await _context.Favorites
                    .Include(f => f.Post)
                        .ThenInclude(p => p.Images)
                    .Include(f => f.Post)
                        .ThenInclude(p => p.Category)
                    .Include(f => f.Post)
                        .ThenInclude(p => p.User)
                    .Include(f => f.Post)
                        .ThenInclude(p => p.Area)
                                    .ThenInclude(a => a.Ward)
                                        .ThenInclude(w => w.District)
                                            .ThenInclude(d => d.City)
                    .Where(f => f.UserId == userId)
                    .OrderByDescending(f => f.CreatedFavorite)
                    .ToListAsync();

                return Ok(favorites);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user favorites");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Thêm bài post vào danh sách yêu thích
        [Authorize]
        [HttpPost("{userId}/{postId}")]
        public async Task<IActionResult> AddFavorite(int userId, int postId)
        {
            try
            {
                // Kiểm tra xem bài post có tồn tại không
                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                {
                    return NotFound("Bài đăng không tồn tại");
                }

                // Kiểm tra xem đã yêu thích chưa
                var existingFavorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserId == userId && f.PostId == postId);

                if (existingFavorite != null)
                {
                    return BadRequest("Bài đăng đã được thêm vào danh sách yêu thích");
                }

                var favorite = new Favorite
                {
                    UserId = userId,
                    PostId = postId,
                    CreatedFavorite = DateTime.Now
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                return Ok(favorite);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding favorite");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Xóa bài post khỏi danh sách yêu thích
        [Authorize]
        [HttpDelete("user/{userId}/post/{postId}")]
        public async Task<IActionResult> RemoveFavoriteByUserAndPost(int userId, int postId)
        {
            try
            {
                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserId == userId && f.PostId == postId);

                if (favorite == null)
                {
                    return NotFound("Không tìm thấy bài đăng trong danh sách yêu thích");
                }

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing favorite");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Kiểm tra xem bài post có trong danh sách yêu thích không
        [AllowAnonymous]
        [HttpGet("check/{postId}")]
        public async Task<IActionResult> CheckFavorite(int postId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Ok(new { isFavorite = false });
                }

                var isFavorite = await _context.Favorites
                    .AnyAsync(f => f.UserId == int.Parse(userId) && f.PostId == postId);

                return Ok(new { isFavorite });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking favorite status");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}