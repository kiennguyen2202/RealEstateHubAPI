using Microsoft.AspNetCore.Mvc;

namespace RealEstateHubAPI.Models
{
    public class AvatarUploadModel
    {
        [FromForm]
        public IFormFile Avatar { get; set; }

        [FromForm]
        public int UserId { get; set; }
    }
}
