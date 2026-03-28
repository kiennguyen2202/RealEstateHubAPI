using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using api.Models;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PriceHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PriceHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        
        // Lấy thống kê giá thị trường theo khu vực
        [HttpGet("market-stats")]
        public async Task<ActionResult> GetMarketStats(
            [FromQuery] int? cityId,
            [FromQuery] int? districtId,
            [FromQuery] int? categoryId,
            [FromQuery] int transactionType = 0,
            [FromQuery] int months = 12)
        {
            // Lấy dữ liệu lịch sử giá
            var query = _context.PriceHistories.AsQueryable();

            if (cityId.HasValue)
                query = query.Where(p => p.CityId == cityId);
            if (districtId.HasValue)
                query = query.Where(p => p.DistrictId == districtId);
            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId);
            
            query = query.Where(p => p.TransactionType == transactionType);

            var cutoffDate = DateTime.UtcNow.AddMonths(-months);
            var cutoffYear = cutoffDate.Year;
            var cutoffMonth = cutoffDate.Month;

            query = query.Where(p => 
                p.Year > cutoffYear || 
                (p.Year == cutoffYear && p.Month >= cutoffMonth));

            var history = await query
                .OrderBy(p => p.Year)
                .ThenBy(p => p.Month)
                .ToListAsync();

            // Nếu không có dữ liệu lịch sử, tính từ posts hiện tại
            if (!history.Any())
            {
                return Ok(await CalculateFromPosts(cityId, districtId, categoryId, transactionType, months));
            }

            return Ok(new
            {
                history = history.Select(h => new
                {
                    month = $"T{h.Month}/{h.Year % 100}",
                    averagePrice = h.AveragePrice,
                    highestPrice = h.HighestPrice,
                    lowestPrice = h.LowestPrice,
                    postCount = h.PostCount
                }),
                summary = new
                {
                    currentAverage = history.LastOrDefault()?.AveragePrice ?? 0,
                    priceChange = CalculatePriceChange(history),
                    rating = CalculateRating(history)
                }
            });
        }

        // Tính toán từ posts hiện tại 
        private async Task<object> CalculateFromPosts(
            int? cityId, int? districtId, int? categoryId, int transactionType, int months)
        {
            var txType = (TransactionType)transactionType;
            var postsQuery = _context.Posts
                .Include(p => p.Area)
                .Where(p => p.IsApproved && p.TransactionType == txType);

            if (categoryId.HasValue)
                postsQuery = postsQuery.Where(p => p.CategoryId == categoryId);

            // Filter by location
            if (districtId.HasValue)
            {
                postsQuery = postsQuery.Where(p => p.Area != null && p.Area.DistrictId == districtId);
            }
            else if (cityId.HasValue)
            {
                postsQuery = postsQuery.Where(p => p.Area != null && p.Area.CityId == cityId);
            }

            var posts = await postsQuery.ToListAsync();

            // Group by month
            var grouped = posts
                .Where(p => p.Created >= DateTime.UtcNow.AddMonths(-months))
                .GroupBy(p => new { p.Created.Year, p.Created.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Posts = g.ToList()
                })
                .OrderBy(g => g.Year)
                .ThenBy(g => g.Month)
                .ToList();

            var history = grouped.Select(g =>
            {
                var pricesPerM2 = g.Posts
                    .Where(p => p.Area_Size > 0)
                    .Select(p => CalculatePricePerM2(p.Price, (int)p.PriceUnit, (decimal)p.Area_Size))
                    .Where(price => price > 0)
                    .ToList();

                return new
                {
                    month = $"T{g.Month}/{g.Year % 100}",
                    averagePrice = pricesPerM2.Any() ? Math.Round(pricesPerM2.Average(), 2) : 0,
                    highestPrice = pricesPerM2.Any() ? Math.Round(pricesPerM2.Max(), 2) : 0,
                    lowestPrice = pricesPerM2.Any() ? Math.Round(pricesPerM2.Min(), 2) : 0,
                    postCount = g.Posts.Count
                };
            }).ToList();

            // Tính summary
            var allPrices = posts
                .Where(p => p.Area_Size > 0)
                .Select(p => CalculatePricePerM2(p.Price, (int)p.PriceUnit, (decimal)p.Area_Size))
                .Where(price => price > 0)
                .ToList();

            var currentAverage = allPrices.Any() ? Math.Round(allPrices.Average(), 2) : 0;
            
            // Tính % thay đổi giá
            decimal priceChange = 0;
            if (history.Count >= 2)
            {
                var firstPrice = history.First().averagePrice;
                var lastPrice = history.Last().averagePrice;
                if (firstPrice > 0)
                {
                    priceChange = Math.Round((lastPrice - firstPrice) / firstPrice * 100, 1);
                }
            }

            return new
            {
                history,
                summary = new
                {
                    currentAverage,
                    priceChange,
                    rating = priceChange > 10 ? 3 : (priceChange > 0 ? 2 : 1) // 1-3 stars
                }
            };
        }

        private decimal CalculatePricePerM2(decimal price, int priceUnit, decimal areaSize)
        {
            if (areaSize <= 0) return 0;
            
            // Convert to triệu
            // priceUnit: 0 = Tỷ, 1 = Triệu
            decimal priceInTrieu = priceUnit == 0 ? price * 1000 : price;
            return priceInTrieu / areaSize;
        }

        private decimal CalculatePriceChange(List<PriceHistory> history)
        {
            if (history.Count < 2) return 0;
            var first = history.First().AveragePrice;
            var last = history.Last().AveragePrice;
            if (first == 0) return 0;
            return Math.Round((last - first) / first * 100, 1);
        }

        private int CalculateRating(List<PriceHistory> history)
        {
            var change = CalculatePriceChange(history);
            return change > 10 ? 3 : (change > 0 ? 2 : 1);
        }

    }
}
