using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace RealEstateHubAPI.Services
{
    public class PostService : IPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<PostService> _logger;

        public PostService(
            ApplicationDbContext context, 
            IWebHostEnvironment env,
            ILogger<PostService> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        public async Task<Post> GetPostById(int id)
        {
            return await _context.Posts
                .Include(p => p.Category)
                .Include(p => p.Area)
                .Include(p => p.User)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Post> CreatePost(Post post)
        {
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task<Post> UpdatePost(Post post)
        {
            var existingPost = await _context.Posts.FindAsync(post.Id);
            if (existingPost == null)
                return null;

            _context.Entry(existingPost).CurrentValues.SetValues(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task<bool> DeletePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return false;

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Post>> GetPosts(string? category = null, string? transaction = null, 
            string? area = null, string? priceRange = null, string? sortBy = null)
        {
            var query = _context.Posts
                .Include(p => p.Category)
                .Include(p => p.Area)
                .Include(p => p.User)
                .Include(p => p.Images)
                .Where(p => p.Status == "active");

            // Filter theo TransactionType
            if (!string.IsNullOrEmpty(transaction))
            {
                if (Enum.TryParse<TransactionType>(transaction, true, out var transactionType))
                {
                    query = query.Where(p => p.TransactionType == transactionType);
                }
            }

            // Filter theo Category
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category.Name == category);
            }

            // Filter theo Area
            //if (!string.IsNullOrEmpty(area))
            //{
            //    query = query.Where(p => p.Area.City == area);
            //}

            // Filter theo PriceRange
            if (!string.IsNullOrEmpty(priceRange))
            {
                var priceRanges = priceRange.Split('-');
                if (priceRanges.Length == 2)
                {
                    if (decimal.TryParse(priceRanges[0], out var minPrice) &&
                        decimal.TryParse(priceRanges[1], out var maxPrice))
                    {
                        query = query.Where(p => p.Price >= minPrice && p.Price <= maxPrice);
                    }
                }
                else if (priceRange.EndsWith("+"))
                {
                    if (decimal.TryParse(priceRange.TrimEnd('+'), out var minPrice))
                    {
                        query = query.Where(p => p.Price >= minPrice);
                    }
                }
            }

            // Sắp xếp
            query = sortBy?.ToLower() switch
            {
                "newest" => query.OrderByDescending(p => p.Created),
                "price-asc" => query.OrderBy(p => p.Price),
                "price-desc" => query.OrderByDescending(p => p.Price),
                "area-asc" => query.OrderBy(p => p.Area_Size),
                "area-desc" => query.OrderByDescending(p => p.Area_Size),
                _ => query.OrderByDescending(p => p.Created)
            };

            return await query.ToListAsync();
        }

        public async Task<bool> UploadPostImages(int postId, List<IFormFile> files)
        {
            try
            {
                _logger.LogInformation("Starting image upload for post {PostId} with {FileCount} files", postId, files?.Count ?? 0);

                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                {
                    _logger.LogWarning("Post {PostId} not found", postId);
                    return false;
                }

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
                _logger.LogInformation("Upload folder path: {UploadPath}", uploadsFolder);

                if (!Directory.Exists(uploadsFolder))
                {
                    _logger.LogInformation("Creating uploads directory at {UploadPath}", uploadsFolder);
                    Directory.CreateDirectory(uploadsFolder);
                }

                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                        var filePath = Path.Combine(uploadsFolder, fileName);
                        _logger.LogInformation("Saving file {FileName} to {FilePath}", fileName, filePath);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        // Create PostImage record
                        var postImage = new PostImage
                        {
                            PostId = postId,
                            Url = $"/uploads/{fileName}"
                        };

                        _context.PostImages.Add(postImage);
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully uploaded {FileCount} images for post {PostId}", files.Count, postId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading images for post {PostId}", postId);
                return false;
            }
        }
    }
} 