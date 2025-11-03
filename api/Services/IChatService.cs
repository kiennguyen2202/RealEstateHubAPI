using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public interface IChatService
    {
        Task<string> GenerateUserTokenAsync(int userId, string userName, string? userImage);
        
        Task EnsureUsersExistAsync(IEnumerable<int> userIds);

        Task DeleteChannelAsync(string channelType, string channelId, bool hardDelete = true);
    }
}
