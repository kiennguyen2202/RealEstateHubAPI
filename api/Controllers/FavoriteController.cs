using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Controllers
{
<<<<<<< HEAD:Controllers/FavoriteController.cs
    [Route("api/[controller]")]
=======
    [Route("api/favorites")]
>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Controllers/FavoriteController.cs
    [ApiController]
    public class FavoriteController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FavoriteController(ApplicationDbContext context)
        {
            _context = context;
        }

<<<<<<< HEAD:Controllers/FavoriteController.cs
        // 1. LẤY DANH SÁCH YÊU THÍCH CỦA USE
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFavoritesByUser(int userId)
        {
            // Tìm tất cả bài viết yêu thích của user, bao gồm thông tin bài viết
            var favorites = await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Post) // Lấy thêm thông tin bài đăng liên quan
                .ToListAsync();

            return Ok(favorites); // Trả về danh sách yêu thích
        }

        // 2. THÊM MỘT BÀI VIẾT VÀO YÊU THÍCH
        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] Favorite favorite)
        {
            if (favorite == null)
                return BadRequest("Favorite không được null.");

            // Kiểm tra nếu bài đăng đã được yêu thích bởi user chưa (tránh thêm trùng)
            var exists = await _context.Favorites
                .AnyAsync(f => f.UserId == favorite.UserId && f.PostId == favorite.PostId);
=======

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
>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Controllers/FavoriteController.cs

            if (exists)
                return BadRequest("Bài viết đã có trong danh sách yêu thích.");

<<<<<<< HEAD:Controllers/FavoriteController.cs
            // Gán thời điểm yêu thích hiện tại
            favorite.CreatedFavorite = DateTime.Now;
=======
            // Tạo mới đối tượng Favorite
            var favorite = new Favorite
            {
                UserId = userId,
                PostId = postId,
                CreatedFavorite = DateTime.Now
            };
>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Controllers/FavoriteController.cs

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();

<<<<<<< HEAD:Controllers/FavoriteController.cs
            // Trả về status 201 Created kèm thông tin đã thêm
            return CreatedAtAction(nameof(GetFavoritesByUser), new { userId = favorite.UserId }, favorite);
        }

        // 3. XÓA YÊU THÍCH THEO ID 
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFavorite(int id)
        {
            var favorite = await _context.Favorites.FindAsync(id);
            if (favorite == null)
                return NotFound();

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();

            return NoContent(); // Trả về 204 (thành công, không có nội dung)
        }

        // 4. XÓA YÊU THÍCH THEO UserId & PostId (hữu ích khi không biết ID)
=======
            return CreatedAtAction(nameof(GetFavoritesByUser), new { userId = userId }, favorite);
        }





>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Controllers/FavoriteController.cs
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

<<<<<<< HEAD:Controllers/FavoriteController.cs
        // 5. KIỂM TRA MỘT BÀI VIẾT ĐÃ ĐƯỢC YÊU THÍCH BỞI USER CHƯA
        [HttpGet("user/{userId}/post/{postId}")]
        public async Task<IActionResult> IsFavorite(int userId, int postId)
        {
            var isFavorite = await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.PostId == postId);

            return Ok(isFavorite); 
        }
    }
}
=======
        
    }
}
>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Controllers/FavoriteController.cs
