using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly ApplicationDbContext _context;
        private readonly IUserRepository _userRepository;

        public AdminController(ApplicationDbContext context, ICategoryRepository categoryRepository, IUserRepository userRepository)
        {
            _context = context;
            _categoryRepository = categoryRepository;
            _userRepository = userRepository;
        }

        // Get admin dashboard stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                totalPosts = await _context.Posts.CountAsync(),
                totalUsers = await _context.Users.CountAsync(),
                totalReports = await _context.Reports.CountAsync(),
                pendingApprovals = await _context.Posts.CountAsync(p => !p.IsApproved)
            };
            return Ok(stats);
        }

        // Get recent posts
        [HttpGet("recent-posts")]
        public async Task<IActionResult> GetRecentPosts()
        {
            var posts = await _context.Posts
                .Include(p => p.User)
                .OrderByDescending(p => p.Created)
                .Take(10)
                .ToListAsync();
            return Ok(posts);
        }

        // Get recent users
        [HttpGet("recent-users")]
        public async Task<IActionResult> GetRecentUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.Create)
                .Take(10)
                .ToListAsync();
            return Ok(users);
        }


        // Approve a post
        [HttpPost("posts/{postId}/approve")]
       
        public async Task<IActionResult> ApprovePost(int postId)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound();

            post.IsApproved = true;
            await _context.SaveChangesAsync();
            return Ok(post);
        }

        // Get all reports with details
        [HttpGet("reports")]

        public async Task<IActionResult> GetReports()
        {
            var reports = await _context.Reports
                .Include(r => r.Post)
                .Include(r => r.User)
                
                .OrderByDescending(r => r.CreatedReport)
                .Select(r => new 
                {
                    r.Id,
                    r.UserId,
                    r.PostId,
                    Type = r.Type.ToString(),
                    r.Other,
                    r.Phone,
                    r.CreatedReport,
                    r.IsHandled,
                    User = new 
                    {
                        r.User.Id,
                        r.User.Name,
                        r.User.Phone
                    },
                    Post = new 
                    {
                        r.Post.Id,
                        r.Post.Title
                    }
                })
                .ToListAsync();
            return Ok(reports);
        }

        // Handle a report
        
        // Delete a post
        [HttpDelete("posts/{postId}")]
        
        public async Task<IActionResult> DeletePost(int postId)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound();

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Lock/Unlock user account
        [HttpPut("users/{userId}/lock")]
        public async Task<IActionResult> ToggleUserLock(int userId, [FromBody] bool isLocked)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            user.IsLocked = isLocked;
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        // Get all categories
        [HttpGet("categories")]
        
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.ToListAsync();
            return Ok(categories);
        }

        [HttpPost("categories")]
       
        public async Task<IActionResult> AddCategory([FromBody] Category category)
        {
            if (string.IsNullOrEmpty(category.Name))
                return BadRequest("Category name is required");

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
        }

        [HttpPut("categories/{id}")]
        
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category category)
        {
            if (id != category.Id)
                return BadRequest();

            var existingCategory = await _context.Categories.FindAsync(id);
            if (existingCategory == null)
                return NotFound();

            existingCategory.Name = category.Name;
            await _context.SaveChangesAsync();
            return Ok(existingCategory);
        }

        [HttpDelete("categories/{id}")]
        
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound();

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Update user role
        [HttpPut("users/{userId}/role")]

        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleDto model)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            if (!Enum.TryParse(typeof(Role), model.Role, true, out var parsedRole))
            {
                return BadRequest("Invalid role. Role must be either 'Admin', 'User', or 'Membership'");
            }

            user.Role = parsedRole.ToString();
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        

        // Delete user (Admin only)
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                Console.WriteLine($"Attempting to delete user with ID: {userId}");
                Console.WriteLine($"User claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}"))}");
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    Console.WriteLine($"User not found with ID: {userId}");
                    return NotFound($"Không tìm thấy user với ID: {userId}");
                }

                Console.WriteLine($"Found user: {user.Name} (ID: {user.Id})");
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Successfully deleted user with ID: {userId}");
                
                return Ok(new { message = "Xóa user thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting user: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi xóa user", error = ex.Message });
            }
        }
    }
}