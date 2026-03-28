using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public enum ProjectStatus
    {
        Upcoming = 0,
        OpenForSale = 1,
        Delivered = 2,
        Unverified = 3
    }

    public class Project
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Name { get; set; }

        public string Slug { get; set; }

        public string? Location { get; set; }

        public int? AreaId { get; set; }

        public string? Type { get; set; }

        public ProjectStatus Status { get; set; } = ProjectStatus.Upcoming;

        public decimal? PriceFrom { get; set; }
        public decimal? PriceTo { get; set; }
        public PriceUnit? PriceUnit { get; set; }

        
        public string? ShortDescription { get; set; }

        public string? Description { get; set; }

        public string? ThumbnailUrl { get; set; }

        public bool IsFeatured { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Detail fields 
        public string? Investor { get; set; }
        public string? Designer { get; set; }
        public string? ScaleSummary { get; set; }
        public string? ProductTypes { get; set; }
        public string? LegalStatus { get; set; }
        public string? Timeline { get; set; }

        public string? VideoUrl { get; set; }

        public virtual Area? Area { get; set; }
        public List<ProjectImage>? Images { get; set; }
    }
}


