using System.ComponentModel.DataAnnotations;

namespace RealEstateHubAPI.DTOs
{
    public class CreateAreaDto
    {
        [Required]
        public int CityId { get; set; }
        [Required]
        public int DistrictId { get; set; }
        [Required]
        public int WardId { get; set; }
    }
}
