using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? PostId { get; set; } 
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        public virtual User User { get; set; }
        public int? SenderId { get; internal set; }
    }
}
