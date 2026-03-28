using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.DTOs
{
    public class CreateProjectDto
    {
        public string Name { get; set; }
        public string Slug { get; set; }
        public string? Location { get; set; }
        public int? CityId { get; set; }
        public int? DistrictId { get; set; }
        public string? Type { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Upcoming;
        public decimal? PriceFrom { get; set; }
        public decimal? PriceTo { get; set; }
        public PriceUnit? PriceUnit { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool IsFeatured { get; set; } = false;
        public int? AreaId { get; set; }
        public string? Investor { get; set; }
        public string? Designer { get; set; }
        public string? ScaleSummary { get; set; }
        public string? ProductTypes { get; set; }
        public string? LegalStatus { get; set; }
        public string? Timeline { get; set; }
        public List<ProjectImageDto>? Images { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoCaption { get; set; }
    }

    public class UpdateProjectDto : CreateProjectDto
    {
    }

    public class ProjectImageDto
    {
        public string Url { get; set; }
        public string? Caption { get; set; }
        public int Order { get; set; } = 0;
    }
}


