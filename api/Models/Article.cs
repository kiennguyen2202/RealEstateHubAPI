using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateHubAPI.Models
{
    public enum ArticleCategory
    {
        General = 0,
        Market = 1,
        Guide = 2,
        Project = 3,
        Company = 4
    }

    public class Article
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Title { get; set; }

        public string Slug { get; set; }

        public string? Excerpt { get; set; }

        public string? Content { get; set; }
        public string? AuthorName { get; set; }
        public string? Tags { get; set; } 
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public int? ReadingMinutes { get; set; }

        public ArticleCategory Category { get; set; } = ArticleCategory.General;

        public string? ThumbnailUrl { get; set; }

        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
        public bool IsPublished { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
    }
}


