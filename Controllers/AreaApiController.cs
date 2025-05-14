using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AreaApiController : ControllerBase
    {
        private readonly IAreaRepository _areareposiory;
        public AreaApiController(IAreaRepository areaRepository)
        {
            _areareposiory = areaRepository;
        }
        [HttpGet]
        public async Task<IActionResult> GetAreas()
        {
            try
            {
                var areas = await _areareposiory.GetAreasAsync();
                return Ok(areas);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAreaById(int id)
        {
            try
            {
                var areas = await _areareposiory.GetAreaByIdAsync(id);
                if (areas == null)
                    return NotFound();
                return Ok(areas);
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
                await _areareposiory.AddAreaAsync(area);
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
        public async Task<IActionResult> UpdateArea(int id, [FromBody]
Area area)
        {
            try
            {
                if (id != area.Id)
                    return BadRequest();
                await _areareposiory.UpdateAreaAsync(area);
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
                await _areareposiory.DeleteAreaAsync(id);
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
