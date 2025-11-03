using System.Text.Json;

namespace RealEstateHubAPI.Models
{
    public class AgentProfileDraftData
    {
        public string UserId { get; set; }
        public JsonElement FormData { get; set; }
        public string? AvatarPreview { get; set; }
        public string? BannerPreview { get; set; }
        public int[]? SelectedAreas { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastModified { get; set; }
    }
}
