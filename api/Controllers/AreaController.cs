using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/areas")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AreaController : ControllerBase
    {
        private readonly IAreaRepository _areaRepository;
        private readonly ApplicationDbContext _context;
        public AreaController(IAreaRepository areaRepository, ApplicationDbContext context)
        {
            _areaRepository = areaRepository;
            _context = context;
        }

        /// <summary>
        /// Tìm hoặc tạo Area dựa trên tên địa chỉ (City, District, Ward)
        /// Endpoint này cho phép client gửi tên địa chỉ và nhận về AreaId
        /// </summary>
        [AllowAnonymous]
        [HttpPost("find-or-create")]
        public async Task<IActionResult> FindOrCreateArea([FromBody] FindOrCreateAreaDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CityName) || 
                    string.IsNullOrWhiteSpace(dto.DistrictName) || 
                    string.IsNullOrWhiteSpace(dto.WardName))
                {
                    return BadRequest("CityName, DistrictName, and WardName are required");
                }

                // Tìm hoặc tạo City
                var city = await _context.Cities
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.CityName.ToLower().Trim());
                
                if (city == null)
                {
                    city = new City { Name = dto.CityName.Trim() };
                    _context.Cities.Add(city);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tạo District
                var district = await _context.Districts
                    .FirstOrDefaultAsync(d => d.Name.ToLower() == dto.DistrictName.ToLower().Trim() && d.CityId == city.Id);
                
                if (district == null)
                {
                    district = new District { Name = dto.DistrictName.Trim(), CityId = city.Id };
                    _context.Districts.Add(district);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tạo Ward
                var ward = await _context.Wards
                    .FirstOrDefaultAsync(w => w.Name.ToLower() == dto.WardName.ToLower().Trim() && w.DistrictId == district.Id);
                
                if (ward == null)
                {
                    ward = new Ward { Name = dto.WardName.Trim(), DistrictId = district.Id };
                    _context.Wards.Add(ward);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tạo Area
                var area = await _context.Areas
                    .FirstOrDefaultAsync(a => a.CityId == city.Id && a.DistrictId == district.Id && a.WardId == ward.Id);
                
                if (area == null)
                {
                    area = new Area 
                    { 
                        CityId = city.Id, 
                        DistrictId = district.Id, 
                        WardId = ward.Id,
                        Latitude = dto.Latitude,
                        Longitude = dto.Longitude
                    };
                    _context.Areas.Add(area);
                    await _context.SaveChangesAsync();
                }
                else if (dto.Latitude.HasValue && dto.Longitude.HasValue)
                {
                    // Cập nhật tọa độ nếu có
                    area.Latitude = dto.Latitude;
                    area.Longitude = dto.Longitude;
                    await _context.SaveChangesAsync();
                }

                return Ok(new 
                { 
                    areaId = area.Id,
                    cityId = city.Id,
                    districtId = district.Id,
                    wardId = ward.Id,
                    cityName = city.Name,
                    districtName = district.Name,
                    wardName = ward.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // City endpoints
        [AllowAnonymous]
        [HttpGet("cities")]
        public async Task<IActionResult> GetCities()
        {
            try
            {
                var cities = await _areaRepository.GetCitiesAsync();
                return Ok(cities);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("cities/{id}")]
        public async Task<IActionResult> GetCityById(int id)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(id);
                if (city == null)
                {
                    return NotFound($"City with ID {id} not found");
                }
                return Ok(city);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("cities")]
        public async Task<IActionResult> CreateCity([FromBody] City city)
        {
            try
            {
                await _areaRepository.AddCityAsync(city);
                return CreatedAtAction(nameof(GetCityById), new { id = city.Id }, city);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // District endpoints
        [AllowAnonymous]
        [HttpGet("districts")]
        public async Task<IActionResult> GetDistricts()
        {
            try
            {
                var districts = await _areaRepository.GetDistrictsAsync();
                return Ok(districts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("districts/{id}")]
        public async Task<IActionResult> GetDistrictById(int id)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(id);
                if (district == null)
                {
                    return NotFound($"District with ID {id} not found");
                }
                return Ok(district);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("cities/{cityId}/districts")]
        public async Task<IActionResult> GetDistrictsByCity(int cityId)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(cityId);
                if (city == null)
                {
                    return NotFound($"City with ID {cityId} not found");
                }

                var districts = await _areaRepository.GetDistrictsByCityAsync(cityId);
                return Ok(districts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("districts")]
        public async Task<IActionResult> CreateDistrict([FromBody] CreateDistrictDto districtDto)
        {
            try
            {
                var city = await _areaRepository.GetCityByIdAsync(districtDto.CityId);
                if (city == null)
                {
                    return NotFound($"City with ID {districtDto.CityId} not found");
                }

                var district = new District
                {
                    Name = districtDto.Name,
                    CityId = districtDto.CityId
                };

                await _areaRepository.AddDistrictAsync(district);
                return CreatedAtAction(nameof(GetDistrictById), new { id = district.Id }, district);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // Ward endpoints
        [AllowAnonymous]
        [HttpGet("wards")]
        public async Task<IActionResult> GetWards()
        {
            try
            {
                var wards = await _areaRepository.GetWardsAsync();
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("wards/{id}")]
        public async Task<IActionResult> GetWardById(int id)
        {
            try
            {
                var ward = await _areaRepository.GetWardByIdAsync(id);
                if (ward == null)
                {
                    return NotFound($"Ward with ID {id} not found");
                }
                return Ok(ward);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("districts/{districtId}/wards")]
        public async Task<IActionResult> GetWardsByDistrict(int districtId)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(districtId);
                if (district == null)
                {
                    return NotFound($"District with ID {districtId} not found");
                }

                var wards = await _areaRepository.GetWardsByDistrictAsync(districtId);
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("wards")]
        public async Task<IActionResult> CreateWard([FromBody] CreateWardDto wardDto)
        {
            try
            {
                var district = await _areaRepository.GetDistrictByIdAsync(wardDto.DistrictId);
                if (district == null)
                {
                    return NotFound($"District with ID {wardDto.DistrictId} not found");
                }

                var ward = new Ward
                {
                    Name = wardDto.Name,
                    DistrictId = wardDto.DistrictId
                };

                await _areaRepository.AddWardAsync(ward);
                return CreatedAtAction(nameof(GetWardById), new { id = ward.Id }, ward);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}