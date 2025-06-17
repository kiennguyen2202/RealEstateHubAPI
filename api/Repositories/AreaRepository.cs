using Microsoft.EntityFrameworkCore;

using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

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
            if (area == null) throw new ArgumentNullException(nameof(area));
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

        // City methods
        public async Task<IEnumerable<City>> GetCitiesAsync()
        {
            return await _context.Cities.ToListAsync();
        }

        public async Task<City> GetCityByIdAsync(int id)
        {
            return await _context.Cities.FindAsync(id);
        }

        public async Task<City> AddCityAsync(City city)
        {
            await _context.Cities.AddAsync(city);
            await _context.SaveChangesAsync();
            return city;
        }

        public async Task<City> UpdateCityAsync(City city)
        {
            _context.Cities.Update(city);
            await _context.SaveChangesAsync();
            return city;
        }

        public async Task DeleteCityAsync(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city != null)
            {
                _context.Cities.Remove(city);
                await _context.SaveChangesAsync();
            }
        }

        // District methods
        public async Task<IEnumerable<District>> GetDistrictsAsync()
        {
            return await _context.Districts
                .Include(d => d.City)
                .ToListAsync();
        }

        public async Task<District> GetDistrictByIdAsync(int id)
        {
            return await _context.Districts
                .Include(d => d.City)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<IEnumerable<District>> GetDistrictsByCityAsync(int cityId)
        {
            return await _context.Districts
                .Include(d => d.City)
                .Where(d => d.CityId == cityId)
                .ToListAsync();
        }

        public async Task<District> AddDistrictAsync(District district)
        {
            await _context.Districts.AddAsync(district);
            await _context.SaveChangesAsync();
            return district;
        }

        public async Task<District> UpdateDistrictAsync(District district)
        {
            _context.Districts.Update(district);
            await _context.SaveChangesAsync();
            return district;
        }

        public async Task DeleteDistrictAsync(int id)
        {
            var district = await _context.Districts.FindAsync(id);
            if (district != null)
            {
                _context.Districts.Remove(district);
                await _context.SaveChangesAsync();
            }
        }

        // Ward methods
        public async Task<IEnumerable<Ward>> GetWardsAsync()
        {
            return await _context.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.City)
                .ToListAsync();
        }

        public async Task<Ward> GetWardByIdAsync(int id)
        {
            return await _context.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.City)
                .FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<IEnumerable<Ward>> GetWardsByDistrictAsync(int districtId)
        {
            return await _context.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.City)
                .Where(w => w.DistrictId == districtId)
                .ToListAsync();
        }

        public async Task<Ward> AddWardAsync(Ward ward)
        {
            await _context.Wards.AddAsync(ward);
            await _context.SaveChangesAsync();
            return ward;
        }

        public async Task<Ward> UpdateWardAsync(Ward ward)
        {
            _context.Wards.Update(ward);
            await _context.SaveChangesAsync();
            return ward;
        }

        public async Task DeleteWardAsync(int id)
        {
            var ward = await _context.Wards.FindAsync(id);
            if (ward != null)
            {
                _context.Wards.Remove(ward);
                await _context.SaveChangesAsync();
            }
        }
    }
}