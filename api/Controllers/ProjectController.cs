using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] bool? featured, [FromQuery] string? city, [FromQuery] string? status)
        {
            var query = _context.Projects
                .Include(p => p.Area)
                .Include(p => p.Images)
                .AsQueryable();

            if (featured.HasValue && featured.Value)
                query = query.Where(p => p.IsFeatured);

            if (!string.IsNullOrEmpty(city))
                query = query.Where(p => p.Location != null && p.Location.Contains(city));

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<ProjectStatus>(status, true, out var s))
                query = query.Where(p => p.Status == s);

            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return Ok(items);
        }

        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var project = await _context.Projects
                .Include(p => p.Area)
                .Include(p => p.Images.OrderBy(i => i.Order))
                .FirstOrDefaultAsync(p => p.Slug == slug);
            if (project == null) return NotFound();
            return Ok(project);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _context.Projects.AnyAsync(p => p.Slug == dto.Slug))
                return Conflict("Slug already exists");

            var entity = new Project
            {
                Name = dto.Name,
                Slug = dto.Slug,
                Location = dto.Location,
                AreaId = dto.AreaId,
                Type = dto.Type,
                Status = dto.Status,
                PriceFrom = dto.PriceFrom,
                PriceTo = dto.PriceTo,
                PriceUnit = dto.PriceUnit,
                ShortDescription = dto.ShortDescription,
                Description = dto.Description,
                ThumbnailUrl = dto.ThumbnailUrl,
                IsFeatured = dto.IsFeatured,
                Investor = dto.Investor,
                Designer = dto.Designer,
                ScaleSummary = dto.ScaleSummary,
                ProductTypes = dto.ProductTypes,
                LegalStatus = dto.LegalStatus,
                Timeline = dto.Timeline,
                VideoUrl = dto.VideoUrl,
                
                Images = dto.Images?.Select((i) => new ProjectImage
                {
                    Url = i.Url,
                    Caption = i.Caption,
                    Order = i.Order
                }).ToList()
            };

            _context.Projects.Add(entity);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBySlug), new { slug = entity.Slug }, entity);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectDto dto)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            if (!string.Equals(project.Slug, dto.Slug, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Projects.AnyAsync(p => p.Slug == dto.Slug))
                    return Conflict("Slug already exists");
            }

            project.Name = dto.Name;
            project.Slug = dto.Slug;
            project.Location = dto.Location;
            project.Type = dto.Type;
            project.Status = dto.Status;
            project.PriceFrom = dto.PriceFrom;
            project.PriceTo = dto.PriceTo;
            project.PriceUnit = dto.PriceUnit;
            project.ShortDescription = dto.ShortDescription;
            project.Description = dto.Description;
            project.ThumbnailUrl = dto.ThumbnailUrl;
            project.IsFeatured = dto.IsFeatured;
            project.UpdatedAt = DateTime.UtcNow;
            project.AreaId = dto.AreaId;
            project.Investor = dto.Investor;
            project.Designer = dto.Designer;
            project.ScaleSummary = dto.ScaleSummary;
            project.ProductTypes = dto.ProductTypes;
            project.LegalStatus = dto.LegalStatus;
            project.Timeline = dto.Timeline;
            project.VideoUrl = dto.VideoUrl;
            

            if (dto.Images != null)
            {
                var existing = await _context.ProjectImages.Where(x => x.ProjectId == project.Id).ToListAsync();
                _context.ProjectImages.RemoveRange(existing);
                project.Images = dto.Images.Select(i => new ProjectImage
                {
                    Url = i.Url,
                    Caption = i.Caption,
                    Order = i.Order
                }).ToList();
            }

            await _context.SaveChangesAsync();
            return Ok(project);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


