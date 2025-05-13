using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Repositories
{
    public class AreaRepository : IAreaRepository
    {
        private readonly ApplicationDbContext _context;
        public AreaRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<Area>> GetAreasAsync()
        {
            return await _context.Areas.ToListAsync();
        }
        public async Task<Area> GetAreaByIdAsync(int id)
        {
            return await _context.Areas.FindAsync(id);
        }
        public async Task AddAreaAsync(Area area)
        {
            _context.Areas.Add(area);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAreaAsync(Area area)
        {
            _context.Entry(area).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAreaAsync(int id)
        {
            var area = await _context.Areas.FindAsync(id);
            if (area != null)
            {
                _context.Areas.Remove(area);
                await _context.SaveChangesAsync();
            }
        }
    }
}