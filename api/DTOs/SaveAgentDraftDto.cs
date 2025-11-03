using System.Text.Json;

namespace RealEstateHubAPI.DTOs
{
    public class SaveAgentDraftDto
    {
        public JsonElement FormData { get; set; }
        public string? AvatarPreview { get; set; }
        public string? BannerPreview { get; set; }
        public int[]? SelectedAreas { get; set; }
    }
}
