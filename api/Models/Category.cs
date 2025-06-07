using System.ComponentModel.DataAnnotations;

namespace RealEstateHubAPI.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        public string Icon { get; set; }  // Icon cho category

        public bool IsActive { get; set; } = true;
    }
}
