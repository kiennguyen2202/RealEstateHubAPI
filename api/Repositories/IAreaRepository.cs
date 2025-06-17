using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Repositories
{
    public interface IAreaRepository
    {
        // City methods
        Task<IEnumerable<City>> GetCitiesAsync();
        Task<City> GetCityByIdAsync(int id);
        Task<City> AddCityAsync(City city);
        Task<City> UpdateCityAsync(City city);
        Task DeleteCityAsync(int id);

        // District methods
        Task<IEnumerable<District>> GetDistrictsAsync();
        Task<District> GetDistrictByIdAsync(int id);
        Task<IEnumerable<District>> GetDistrictsByCityAsync(int cityId);
        Task<District> AddDistrictAsync(District district);
        Task<District> UpdateDistrictAsync(District district);
        Task DeleteDistrictAsync(int id);

        // Ward methods
        Task<IEnumerable<Ward>> GetWardsAsync();
        Task<Ward> GetWardByIdAsync(int id);
        Task<IEnumerable<Ward>> GetWardsByDistrictAsync(int districtId);
        Task<Ward> AddWardAsync(Ward ward);
        Task<Ward> UpdateWardAsync(Ward ward);
        Task DeleteWardAsync(int id);
    }
}
