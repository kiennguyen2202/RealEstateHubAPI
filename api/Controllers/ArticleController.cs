using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/articles")]
    public class ArticleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ArticleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] bool? featured)
        {
            var query = _context.Articles.AsQueryable();
            if (!string.IsNullOrEmpty(category) && Enum.TryParse<ArticleCategory>(category, true, out var c))
                query = query.Where(a => a.Category == c);
            if (featured.HasValue && featured.Value)
                query = query.Where(a => a.IsFeatured);

            var items = await query
                .Where(a => a.IsPublished)
                .OrderByDescending(a => a.PublishedAt)
                .ToListAsync();
            return Ok(items);
        }

        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var article = await _context.Articles.FirstOrDefaultAsync(a => a.Slug == slug && a.IsPublished);
            if (article == null) return NotFound();
            return Ok(article);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateArticleDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _context.Articles.AnyAsync(a => a.Slug == dto.Slug))
                return Conflict("Slug already exists");

            var entity = new Article
            {
                Title = dto.Title,
                Slug = dto.Slug,
                Excerpt = dto.Excerpt,
                Content = dto.Content,
                Category = dto.Category,
                ThumbnailUrl = dto.ThumbnailUrl,
                IsPublished = dto.IsPublished,
                IsFeatured = dto.IsFeatured,
                PublishedAt = dto.PublishedAt ?? DateTime.UtcNow,
                AuthorName = dto.AuthorName,
                Tags = dto.Tags,
                SeoTitle = dto.SeoTitle,
                SeoDescription = dto.SeoDescription,
                ReadingMinutes = dto.ReadingMinutes
            };

            _context.Articles.Add(entity);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBySlug), new { slug = entity.Slug }, entity);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateArticleDto dto)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();

            if (!string.Equals(article.Slug, dto.Slug, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Articles.AnyAsync(a => a.Slug == dto.Slug))
                    return Conflict("Slug already exists");
            }

            article.Title = dto.Title;
            article.Slug = dto.Slug;
            article.Excerpt = dto.Excerpt;
            article.Content = dto.Content;
            article.Category = dto.Category;
            article.ThumbnailUrl = dto.ThumbnailUrl;
            article.IsPublished = dto.IsPublished;
            article.IsFeatured = dto.IsFeatured;
            article.PublishedAt = dto.PublishedAt ?? article.PublishedAt;
            article.AuthorName = dto.AuthorName;
            article.Tags = dto.Tags;
            article.SeoTitle = dto.SeoTitle;
            article.SeoDescription = dto.SeoDescription;
            article.ReadingMinutes = dto.ReadingMinutes;

            await _context.SaveChangesAsync();
            return Ok(article);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();
            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


