using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Repositories
{
    public interface IAreaRepository
    {
        Task<IEnumerable<Area>> GetAreasAsync();
        Task<Area> GetAreaByIdAsync(int id);
        Task AddAreaAsync(Area area);
        Task UpdateAreaAsync(Area area);
        Task DeleteAreaAsync(int id);
    }
}
