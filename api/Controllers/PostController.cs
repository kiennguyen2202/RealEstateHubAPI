using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using Microsoft.Extensions.Logging;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/posts")]
    
    public class PostController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<PostController> _logger;

        public PostController(ApplicationDbContext context, IWebHostEnvironment env, ILogger<PostController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }
        [AllowAnonymous]
[HttpGet]
public async Task<IActionResult> GetPosts([FromQuery] bool? isApproved)
{
    var posts = _context.Posts
        .Include(p => p.User)
        .Include(p => p.Category)
        .Include(p => p.Area)
            .ThenInclude(a => a.Ward)
                .ThenInclude(w => w.District)
                    .ThenInclude(d => d.City)
        .Include(p => p.Images)
        .AsQueryable();

    if (isApproved.HasValue)
        posts = posts.Where(p => p.IsApproved == isApproved.Value);

    return Ok(await posts.ToListAsync());
}

        // GET: api/posts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var post = await _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Area)
                        .ThenInclude(a => a.Ward)
                            .ThenInclude(w => w.District)
                                .ThenInclude(d => d.City)
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
                // Log received data
                _logger.LogInformation($"Received CreatePostDto: {System.Text.Json.JsonSerializer.Serialize(dto)}");

                // Validate required fields
                if (string.IsNullOrEmpty(dto.Title) || string.IsNullOrEmpty(dto.Description) || 
                    dto.Price <= 0 || dto.Area_Size <= 0 || string.IsNullOrEmpty(dto.Street_Name) || 
                    dto.CategoryId <= 0 || dto.AreaId <= 0 || dto.UserId <= 0)
                {
                    return BadRequest("All required fields must be filled with valid values");
                }

                // Parse TransactionType from string to enum
                if (!Enum.TryParse<TransactionType>(dto.TransactionType.ToString(), true, out var transactionType))
                {
                    return BadRequest($"Invalid TransactionType: {dto.TransactionType}. Must be either 'Sale' or 'Rent'");
                }

                // Verify Category exists
                var category = await _context.Categories.FindAsync(dto.CategoryId);
                if (category == null)
                {
                    return BadRequest($"Category with ID {dto.CategoryId} not found");
                }

                // Verify Ward exists and create Area
                var ward = await _context.Wards
                    .Include(w => w.District)
                    .ThenInclude(d => d.City)
                    .FirstOrDefaultAsync(w => w.Id == dto.AreaId);

                if (ward == null)
                {
                    _logger.LogWarning($"Ward with ID {dto.AreaId} not found");
                    return BadRequest($"Ward with ID {dto.AreaId} not found. Please select a valid ward.");
                }

                // Create new Area
                var area = new Area
                {
                    CityId = ward.District.CityId,
                    DistrictId = ward.DistrictId,
                    WardId = ward.Id
                };

                _context.Areas.Add(area);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created new Area with ID: {area.Id} for Ward: {ward.Id}");

                // Verify User exists
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                {
                    return BadRequest($"User with ID {dto.UserId} not found");
                }

                var post = new Post
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Price = dto.Price,
                    TransactionType = transactionType,
                    PriceUnit = dto.PriceUnit,
                    Status = dto.Status,
                    Street_Name = dto.Street_Name,
                    Area_Size = dto.Area_Size,
                    Created = DateTime.Now,
                    CategoryId = dto.CategoryId,
                    AreaId = area.Id, 
                    UserId = dto.UserId,
                    IsApproved = false,
                    Images = new List<PostImage>()
                };

                // Log post object before saving
                _logger.LogInformation($"Created Post object: {System.Text.Json.JsonSerializer.Serialize(post)}");

                if (dto.Images != null && dto.Images.Any())
                {
                    var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    foreach (var image in dto.Images)
                    {
                        var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                        var filePath = Path.Combine(uploadsPath, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        post.Images.Add(new PostImage { Url = $"/uploads/{fileName}" });
                    }
                }

                _context.Posts.Add(post);
                
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogError($"Database update error: {ex.Message}");
                    _logger.LogError($"Inner exception: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
                }

                return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in Create post: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: api/posts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdatePostDto updateDto)
        {
            if (id != updateDto.Id)
                return BadRequest("ID không khớp.");

            var post = await _context.Posts
                .Include(p => p.Images) 
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return NotFound("Bài đăng không tìm thấy.");

           
            post.Title = updateDto.Title;
            post.Description = updateDto.Description;
            post.Price = updateDto.Price;
            post.PriceUnit = updateDto.PriceUnit;
            post.TransactionType = updateDto.TransactionType;
            post.Status = updateDto.Status; 
            post.Street_Name = updateDto.Street_Name;
            post.Area_Size = updateDto.Area_Size;
            post.CategoryId = updateDto.CategoryId;
            post.AreaId = updateDto.AreaId;
            

            // Handle new images
            if (updateDto.Images != null && updateDto.Images.Any())
            {
                var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                foreach (var image in updateDto.Images)
                {
                    // Generate unique file name
                    var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    post.Images.Add(new PostImage { Url = $"/uploads/{fileName}" });
                }
            }

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
        [HttpGet("user/{userId}")]
         public async Task<IActionResult> GetPostsByUser(int userId)
         {
              var posts = await _context.Posts          
              .Include(p => p.Images)
              .Where(p => p.UserId == userId)
              .OrderByDescending(p => p.Created)
              .ToListAsync();
               return Ok(posts);
         }
        



    }
}