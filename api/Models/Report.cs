using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class Report
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PostId { get; set; }
        public ReportType Type { get; set; }
        public string? Other { get; set; }
        public string? Phone { get; set; }
        public DateTime CreatedReport { get; set; } = DateTime.Now;

        public User? User { get; set; }
        public Post? Post { get; set; }
    }


}
