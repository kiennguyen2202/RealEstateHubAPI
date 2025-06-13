using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.Services;
using RealEstateHubAPI.Model;
using Microsoft.AspNetCore.Authorization;
using RealEstateHubAPI.Repositories;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserRepository _userRepository;


        public AuthController(IAuthService authService, IUserRepository userRepository)
        {
            _authService = authService;
            _userRepository = userRepository;
        }
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var users = await _userRepository.GetUsersAsync();
            var user = users.FirstOrDefault(u => u.Email == model.Email && u.Password == model.Password);
            
            if (user == null)
                return Unauthorized("Invalid credentials");
                
            if (user.IsLocked)
                return BadRequest("Tài khoản của bạn đã bị khóa");

            var token = _authService.GenerateJwtToken(user);

            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role.ToString(), // Convert enum to string
                IsLocked = user.IsLocked
            };

            return Ok(new { user = userDto, token });
        }
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (model.Password != model.ConfirmPassword)
                {
                    return BadRequest("Mật khẩu xác nhận không khớp");
                }

                var user = await _authService.Register(model);
                if (user == null)
                    return BadRequest("Email đã tồn tại");

                var token = _authService.GenerateJwtToken(user);
                
                var userDto = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    AvatarUrl = user.AvatarUrl,
                    Role = user.Role.ToString(), // Convert enum to string
                    IsLocked = user.IsLocked
                };

                return Ok(new { user = userDto, token });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


    }

    public class LoginModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    public class RegisterModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        public string ConfirmPassword { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

}
