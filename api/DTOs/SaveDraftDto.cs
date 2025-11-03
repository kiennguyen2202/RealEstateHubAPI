using System.Text.Json;

namespace RealEstateHubAPI.DTOs
{
    public class SaveDraftDto
    {
        public JsonElement FormData { get; set; }
        public int CurrentStep { get; set; }
    }
}
