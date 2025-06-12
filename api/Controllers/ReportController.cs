using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using static RealEstateHubAPI.Models.Report;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reports
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reports = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Post)
                    .ThenInclude(p => p.Category)
                .Include(r => r.Post)
                    .ThenInclude(p => p.Area)
                .Include(r => r.Post)
                    .ThenInclude(p => p.Images)
                .ToListAsync();

            var result = reports.Select(r => new ReportDetailDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User?.Name ?? "Ẩn danh",
                PostId = r.PostId,
                PostTitle = r.Post?.Title ?? "Không có tiêu đề",
                CategoryName = r.Post?.Category?.Name ?? "Không có",
                AreaName = r.Post?.Area != null
                    ? $"{r.Post.Area.City}, {r.Post.Area.District}, {r.Post.Area.Ward}"
                    : "Không có",
                ImageUrls = r.Post?.Images?.Select(i => i.Url).ToList() ?? new List<string>(),
                Type = r.Type.ToString(),
                Other = r.Other,
                Phone = r.Phone,
                CreatedReport = r.CreatedReport
            }).ToList();

            return Ok(result);
        }

        // GET: api/reports/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await GetReportDtoById(id);
            return result is null ? NotFound("Không tìm thấy báo cáo.") : Ok(result);
        }

        // GET: api/reports/types
        [HttpGet("types")]
        public IActionResult GetReportTypes()
        {
            var types = Enum.GetValues(typeof(ReportType))
                .Cast<ReportType>()
                .Select(rt => new { id = (int)rt, name = rt.ToString() });

            return Ok(types);
        }

        // POST: api/reports
        [HttpPost]

        public async Task<IActionResult> Create([FromBody] CreateReportDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            var post = await _context.Posts.FindAsync(dto.PostId);

            if (user == null || post == null)
                return BadRequest("User hoặc bài đăng không tồn tại.");

            if (dto.Type == ReportType.Other && string.IsNullOrWhiteSpace(dto.Other))
                return BadRequest("Vui lòng nhập chi tiết cho loại báo cáo 'Other'.");

            var report = new Report
            {
                UserId = dto.UserId,
                PostId = dto.PostId,
                Type = dto.Type,
                Other = dto.Other,
                Phone = dto.Phone,
                CreatedReport = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            var result = await GetReportDtoById(report.Id);
            return Ok(result);
        }
        

        
        private async Task<ReportDto?> GetReportDtoById(int id)
        {
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Post).ThenInclude(p => p.Category)
                .Include(r => r.Post).ThenInclude(p => p.Area)
                .Include(r => r.Post).ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null) return null;

            return new ReportDto
            {
                Id = report.Id,
                Phone = report.Phone,
                Other = report.Other,
                CreatedReport = report.CreatedReport,
                Type = report.Type.ToString(),
                User = new SimpleUserDto
                {
                    Id = report.User.Id,
                    Name = report.User.Name,
                    Phone = report.User.Phone
                },
                Post = new SimplePostDto
                {
                    Id = report.Post.Id,
                    Title = report.Post.Title,
                    Price = report.Post.Price,
                    Category = report.Post.Category != null ? new CategoryDto
                    {
                        Id = report.Post.Category.Id,
                        Name = report.Post.Category.Name
                    } : null,
                    Area = report.Post.Area != null ? new AreaDto
                    {
                        Id = report.Post.Area.Id,
                        Name = $"{report.Post.Area.City}, {report.Post.Area.District}, {report.Post.Area.Ward}"
                    } : null,
                    Images = report.Post.Images?.Select(i => i.Url).ToList() ?? new List<string>()
                }
            };
        }
    }
}
