using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.DTOs
{
    public class CreateArticleDto
    {
        public string Title { get; set; }
        public string Slug { get; set; }
        public string? Excerpt { get; set; }
        public string? Content { get; set; }
        public ArticleCategory Category { get; set; } = ArticleCategory.General;
        public string? ThumbnailUrl { get; set; }
        public DateTime? PublishedAt { get; set; }
        public bool IsPublished { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public string? AuthorName { get; set; }
        public string? Tags { get; set; }
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public int? ReadingMinutes { get; set; }
    }

    public class UpdateArticleDto : CreateArticleDto
    {
    }
}


