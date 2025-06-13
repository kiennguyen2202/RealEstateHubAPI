using System.ComponentModel.DataAnnotations;

namespace RealEstateHubAPI.Model
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        [Required(AllowEmptyStrings = true)]
        public string Password { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public DateTime Create { get; set; } = DateTime.Now;
        public bool IsLocked { get; set; }

        public string Role { get; set; } = "User";
    } 
}
