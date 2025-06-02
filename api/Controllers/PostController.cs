using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/posts")]

    public class PostController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public PostController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }
        [AllowAnonymous]
        // GET: api/posts
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var posts = await _context.Posts
                    .Include(p => p.Category)
                   
                    .Include(p => p.Area)
                    
                    .Include(p => p.User)
                    .Include(p => p.Images)
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết hơn trong môi trường phát triển
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/posts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var post = await _context.Posts
                    .Include(p => p.Category)
                    // Giữ Include Area và các thành phần của nó cho GetById
                    .Include(p => p.Area)
                    
                    .Include(p => p.User)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return NotFound();

                return Ok(post);
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết hơn trong môi trường phát triển
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/posts
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreatePostDto dto)
        {
            try
            {
                var post = new Post
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Price = dto.Price,
                    TransactionType=dto.TransactionType,
                    PriceUnit = dto.PriceUnit,
                    Status = dto.Status,
                    Street_Name = dto.Street_Name,
                    Area_Size = dto.Area_Size,
                    Created = DateTime.Now,
                    CategoryId = dto.CategoryId,
                    AreaId = dto.AreaId,
                    UserId = dto.UserId,
                    Images = new List<PostImage>()
                };

                if (dto.Images != null && dto.Images.Any())
                {
                    foreach (var image in dto.Images)
                    {
                        var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                        var filePath = Path.Combine(_env.WebRootPath, "uploads", fileName);
                        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        post.Images.Add(new PostImage { Url = $"/uploads/{fileName}" });
                    }
                }

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error.");
            }
        }

        // PUT: api/posts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Post updatePost)
        {
            if (id != updatePost.Id)
                return BadRequest("ID không khớp.");

            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return NotFound();

            post.Title = updatePost.Title;
            post.Description = updatePost.Description;
            post.Price = updatePost.Price;
            post.PriceUnit = updatePost.PriceUnit;
            post.TransactionType = updatePost.TransactionType;
            post.Status = updatePost.Status;
            post.Street_Name = updatePost.Street_Name;
            post.Area_Size = updatePost.Area_Size;
            post.CategoryId = updatePost.CategoryId;
            post.AreaId = updatePost.AreaId;
            post.UserId = updatePost.UserId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/posts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var post = await _context.Posts
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (post == null)
                return NotFound();

            _context.PostImages.RemoveRange(post.Images);
            _context.Posts.Remove(post);

            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("search")] 
        public async Task<ActionResult<IEnumerable<Post>>> SearchPosts(
            
            [FromQuery] int? categoryId,
            [FromQuery] string status,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] decimal? minArea,
            [FromQuery] decimal? maxArea,
            [FromQuery] int? cityId,
            [FromQuery] int? districtId,
            [FromQuery] int? wardId,
            [FromQuery] string q)
        {
            try
            {
                var query = _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Area)
                    
                    .Include(p => p.User)
                    .AsQueryable();

                // Apply filters
                if (categoryId.HasValue)
                    query = query.Where(p => p.CategoryId == categoryId);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(p => p.Status == status);

                if (minPrice.HasValue)
                    query = query.Where(p => p.Price >= minPrice);

                if (maxPrice.HasValue)
                    query = query.Where(p => p.Price <= maxPrice);

                if (minArea.HasValue)
                    query = query.Where(p => p.Area_Size >= (float)minArea);

                if (maxArea.HasValue)
                    query = query.Where(p => p.Area_Size <= (float)maxArea);

               

                if (!string.IsNullOrEmpty(q))
                {
                    query = query.Where(p =>
                        p.Title.Contains(q) ||
                        p.Description.Contains(q) ||
                        p.Street_Name.Contains(q) 
                    );
                }

                var posts = await query.ToListAsync();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}