using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/favorites")]
    [ApiController]
    public class FavoriteController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FavoriteController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFavoritesByUser(int userId)
        {
            var favorites = await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Post)    // Lấy thông tin bài đăng
                .Include(f => f.User)    // Lấy thông tin người dùng
                .ToListAsync();

            return Ok(favorites);
        }



        [HttpPost("{userId}/{postId}")]
        public async Task<IActionResult> AddFavorite(int userId, int postId)
        {
            // Kiểm tra đã tồn tại chưa
            var exists = await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.PostId == postId);

            if (exists)
                return BadRequest("Bài viết đã có trong danh sách yêu thích.");

            // Tạo mới đối tượng Favorite
            var favorite = new Favorite
            {
                UserId = userId,
                PostId = postId,
                CreatedFavorite = DateTime.Now
            };

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFavoritesByUser), new { userId = userId }, favorite);
        }





        [HttpDelete("user/{userId}/post/{postId}")]
        public async Task<IActionResult> RemoveFavoriteByUserAndPost(int userId, int postId)
        {
            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.PostId == postId);

            if (favorite == null)
                return NotFound();

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();

            return NoContent(); // Xóa thành công
        }


    }
}