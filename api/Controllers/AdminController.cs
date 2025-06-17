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
        private readonly IAreaRepository _areaRepository;

        public AdminController(ApplicationDbContext context, ICategoryRepository categoryRepository, IUserRepository userRepository, IAreaRepository areaRepository)
        {
            _context = context;
            _categoryRepository = categoryRepository;
            _userRepository = userRepository;
            _areaRepository = areaRepository;
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

        // City endpoints
        [AllowAnonymous]
        [HttpGet("cities")]
        public async Task<IActionResult> GetCities()
        {
            try
            {
                var cities = await _areaRepository.GetCitiesAsync();
                return Ok(cities);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("cities/{id}")]
        public async Task<IActionResult> GetCityById(int id)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(id);
                if (city == null)
                {
                    return NotFound($"City with ID {id} not found");
                }
                return Ok(city);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("cities")]
        public async Task<IActionResult> CreateCity([FromBody] City city)
        {
            try
            {
                await _areaRepository.AddCityAsync(city);
                return CreatedAtAction(nameof(GetCityById), new { id = city.Id }, city);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("cities/{id}")]
        public async Task<IActionResult> UpdateCity(int id, [FromBody] City city)
        {
            try
            {
                if (id != city.Id)
                {
                    return BadRequest("City ID mismatch.");
                }
                await _areaRepository.UpdateCityAsync(city);
                return Ok(city);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("cities/{id}")]
        public async Task<IActionResult> DeleteCity(int id)
        {
            try
            {
                await _areaRepository.DeleteCityAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // District endpoints
        [HttpGet("districts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDistricts()
        {
            try
            {
                var districts = await _areaRepository.GetDistrictsAsync();
                return Ok(districts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("districts/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDistrictById(int id)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(id);
                if (district == null)
                {
                    return NotFound($"District with ID {id} not found");
                }
                return Ok(district);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("cities/{cityId}/districts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDistrictsByCity(int cityId)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(cityId);
                if (city == null)
                {
                    return NotFound($"City with ID {cityId} not found");
                }

                var districts = await _areaRepository.GetDistrictsByCityAsync(cityId);
                return Ok(districts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("districts")]
        public async Task<IActionResult> CreateDistrict([FromBody] CreateDistrictDto districtDto)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(districtDto.CityId);
                if (city == null)
                {
                    return NotFound($"City with ID {districtDto.CityId} not found");
                }

                var district = new District
                {
                    Name = districtDto.Name,
                    CityId = districtDto.CityId
                };

                await _areaRepository.AddDistrictAsync(district);
                return CreatedAtAction(nameof(GetDistrictById), new { id = district.Id }, district);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("areas/districts/{id}")]
        public async Task<IActionResult> UpdateDistrict(int id, [FromBody] CreateDistrictDto districtDto)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(id);
                if (district == null)
                {
                    return NotFound($"District with ID {id} not found.");
                }
                district.Name = districtDto.Name;
                district.CityId = districtDto.CityId;
                await _areaRepository.UpdateDistrictAsync(district);
                return Ok(district);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }


        [HttpDelete("districts/{id}")]
        public async Task<IActionResult> DeleteDistrict(int id)
        {
            try
            {
                await _areaRepository.DeleteDistrictAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // Ward endpoints
        [HttpGet("wards")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWards()
        {
            try
            {
                var wards = await _areaRepository.GetWardsAsync();
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("wards/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWardById(int id)
        {
            try
            {
                var ward = await _areaRepository.GetWardByIdAsync(id);
                if (ward == null)
                {
                    return NotFound($"Ward with ID {id} not found");
                }
                return Ok(ward);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("districts/{districtId}/wards")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWardsByDistrict(int districtId)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(districtId);
                if (district == null)
                {
                    return NotFound($"District with ID {districtId} not found");
                }

                var wards = await _areaRepository.GetWardsByDistrictAsync(districtId);
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("wards")]
        public async Task<IActionResult> CreateWard([FromBody] CreateWardDto wardDto)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(wardDto.DistrictId);
                if (district == null)
                {
                    return NotFound($"District with ID {wardDto.DistrictId} not found");
                }

                var ward = new Ward
                {
                    Name = wardDto.Name,
                    DistrictId = wardDto.DistrictId
                };

                await _areaRepository.AddWardAsync(ward);
                return CreatedAtAction(nameof(GetWardById), new { id = ward.Id }, ward);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("areas/wards/{id}")]
        public async Task<IActionResult> UpdateWard(int id, [FromBody] CreateWardDto wardDto)
        {
            try
            {
                var ward = await _areaRepository.GetWardByIdAsync(id);
                if (ward == null)
                {
                    return NotFound($"Ward with ID {id} not found.");
                }
                ward.Name = wardDto.Name;
                ward.DistrictId = wardDto.DistrictId;
                await _areaRepository.UpdateWardAsync(ward);
                return Ok(ward);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }


        [HttpDelete("wards/{id}")]
        public async Task<IActionResult> DeleteWard(int id)
        {
            try
            {
                await _areaRepository.DeleteWardAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}