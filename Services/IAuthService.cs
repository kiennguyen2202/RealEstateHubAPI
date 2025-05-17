using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Services
{
    public interface IAuthService
    {
        Task<User?> Authenticate(string email, string password);
        string GenerateJwtToken(User user);
    }
}
