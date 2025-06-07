using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using System.Security.Claims;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/users")]
    [ApiController]
    //[Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public UserController(IUserRepository userRepository, ApplicationDbContext context, IWebHostEnvironment env)
        {
            _userRepository = userRepository;
            _context = context;
            _env = env;
          
        }

        

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _userRepository.GetUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            return user == null ? NotFound() : Ok(user);
        }

        [AllowAnonymous] 
        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            await _userRepository.AddUserAsync(user);
            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
        }

        

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            await _userRepository.DeleteUserAsync(id);
            return NoContent();
        }
        
        [HttpGet("profile")]
public async Task<IActionResult> GetProfile()
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = int.Parse(userIdClaim);
    var user = await _context.Users.FindAsync(userId);
    if (user == null) return NotFound();
    return Ok(user);
}


        [HttpPut("profile")]
public async Task<IActionResult> UpdateProfile([FromBody] User updateUser)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = int.Parse(userIdClaim);

    var user = await _context.Users.FindAsync(userId);
    if (user == null) return NotFound();

    // Cập nhật các trường được phép
    user.Name = updateUser.Name;
    user.Email = updateUser.Email;
    user.Phone = updateUser.Phone;
    user.AvatarUrl = updateUser.AvatarUrl;

    await _context.SaveChangesAsync();
    return Ok(user);
}


        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] AvatarUploadModel model)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var userId = int.Parse(userIdClaim);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Lấy file avatar từ model
            var avatar = model.Avatar;
            if (avatar == null || avatar.Length == 0)
                return BadRequest("No file uploaded.");

            // Đường dẫn lưu file upload
            var uploads = Path.Combine(_env.WebRootPath, "uploads", "avatars");
            if (!Directory.Exists(uploads))
                Directory.CreateDirectory(uploads);

            // Tạo tên file mới tránh trùng
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
            var filePath = Path.Combine(uploads, fileName);

            // Lưu file lên server
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await avatar.CopyToAsync(stream);
            }

            // Cập nhật URL avatar cho user
            user.AvatarUrl = $"/uploads/avatars/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { avatarUrl = user.AvatarUrl });
        }


    }
}
