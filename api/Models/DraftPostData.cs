using System.Text.Json;

namespace RealEstateHubAPI.Models
{
    public class DraftPostData
    {
        public int UserId { get; set; }
        public JsonElement FormData { get; set; }
        public int CurrentStep { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastModified { get; set; }
    }
}
