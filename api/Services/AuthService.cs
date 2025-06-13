using Microsoft.IdentityModel.Tokens;
using RealEstateHubAPI.Controllers;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RealEstateHubAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<User?> Authenticate(string email, string password)
        {
            var users = await _userRepository.GetUsersAsync();
            return users.FirstOrDefault(u => u.Email == email && u.Password == password && !u.IsLocked);
        }
        public async Task<User?> Register(RegisterModel model)
        {
            var users = await _userRepository.GetUsersAsync();
            var existingUser = users.FirstOrDefault(u => u.Email == model.Email);
            if (existingUser != null) return null;

            var newUser = new User
            {
                Email = model.Email,
                Password = model.Password,
                Name = model.Name,
                Phone =model.Phone,
               

            };

            await _userRepository.AddUserAsync(newUser);
            return newUser;
        }

        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        }),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryInMinutes"])),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

    }
}
