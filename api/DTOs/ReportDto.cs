using RealEstateHubAPI.Models;
using static RealEstateHubAPI.Models.Report;

namespace RealEstateHubAPI.DTOs
{
    public class ReportDto
    {
        public int Id { get; set; }
        public string? Phone { get; set; }
        public string? Other { get; set; }
        public DateTime CreatedReport { get; set; }
        public string Type { get; set; }

        public SimpleUserDto User { get; set; }
        public SimplePostDto Post { get; set; }
    }

    public class SimpleUserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
    }

    public class SimplePostDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal Price { get; set; }
        public CategoryDto? Category { get; set; }
        public AreaDto? Area { get; set; }
        public List<string>? Images { get; set; }
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class AreaDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
    public class CreateReportDto
    {
        public int UserId { get; set; }
        public int PostId { get; set; }
        public ReportType Type { get; set; }
        public string? Other { get; set; }
        public string? Phone { get; set; }
    }
    public class UpdateReportDto
    {
        public int UserId { get; set; }
        public int PostId { get; set; }
        public ReportType Type { get; set; }
        public string? Other { get; set; }
        public string? Phone { get; set; }
    }
}

