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

    public class CreateDistrictDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public int CityId { get; set; }
    }

    public class CreateWardDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public int DistrictId { get; set; }
    }

    /// <summary>
    /// DTO để tìm hoặc tạo Area dựa trên tên địa chỉ
    /// </summary>
    public class FindOrCreateAreaDto
    {
        [Required]
        public string CityName { get; set; } = string.Empty;
        
        [Required]
        public string DistrictName { get; set; } = string.Empty;
        
        [Required]
        public string WardName { get; set; } = string.Empty;
        
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
    }
}
