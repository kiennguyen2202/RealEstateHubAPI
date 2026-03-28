using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/compare")]
    [ApiController]
    

    public class CompareController : Controller
    {
        private readonly ApplicationDbContext _context;
        public CompareController(ApplicationDbContext context)
        {
            _context = context;
            
        }
        [HttpGet("compare")]
        public async Task<IActionResult> Compare([FromQuery] int id1, [FromQuery] int id2)
        {
            var property1 = await _context.Posts
                
                .Include(p => p.Category)
                .Include(p => p.Area)
                .FirstOrDefaultAsync(p => p.Id == id1);

            var property2 = await _context.Posts
                
                .Include(p => p.Category)
                .Include(p => p.Area)
                .FirstOrDefaultAsync(p => p.Id == id2);

            if (property1 == null || property2 == null)
                return NotFound("Không tìm thấy bất động sản");

            return Ok(new { property1, property2 });
        }
    }
}
