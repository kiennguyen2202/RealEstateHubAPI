using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/areas")]
    [ApiController]
    //[Authorize(Roles = "Admin")]
    public class AreaController : ControllerBase
    {
        private readonly IAreaRepository _areaReposiory;
        public AreaController(IAreaRepository areaRepository)
        {
            _areaReposiory = areaRepository;
        }
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAreas()
        {
            try
            {
                var areas = await _areaReposiory.GetAreasAsync();
                return Ok(areas);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAreaById(int id)
        {
            try
            {
                var area = await _areaReposiory.GetAreaByIdAsync(id);
                if (area == null)
                    return NotFound();
                return Ok(area);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddArea([FromBody] Area area)
        {
            try
            {
                await _areaReposiory.AddAreaAsync(area);
                return CreatedAtAction(nameof(GetAreaById), new
                {
                    id = area.Id
                }, area);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArea(int id, [FromBody] Area area)
        {
            try
            {
                if (id != area.Id)
                    return BadRequest();
                await _areaReposiory.UpdateAreaAsync(area);
                return NoContent();
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArea(int id)
        {
            try
            {
                await _areaReposiory.DeleteAreaAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
    }
}