using RealEstateHubAPI.Controllers;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Services
{
    public interface IAuthService
    {
        Task<User?> Authenticate(string email, string password);
        Task<User?> Register(RegisterModel model);
        string GenerateJwtToken(User user);
    }
}
