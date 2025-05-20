namespace RealEstateHubAPI.DTOs
{
    public class ReportDetailDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int PostId { get; set; }
        public string PostTitle { get; set; }
        public string? CategoryName { get; set; }
        public string? AreaName { get; set; }
        public List<string>? ImageUrls { get; set; }
        public string Type { get; set; } // Tên của loại báo cáo
        public string? Other { get; set; }
        public string? Phone { get; set; }
        public DateTime CreatedReport { get; set; }
    }
}
