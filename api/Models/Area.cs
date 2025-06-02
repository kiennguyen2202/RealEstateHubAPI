using System.ComponentModel.DataAnnotations.Schema;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Model
{
    public class Area
    {
        public int Id { get; set; }
        
        public int CityId { get; set; }
        public int DistrictId { get; set; }
        public int WardId { get; set; }
       
        public virtual City? City { get; set; }
        public virtual District? District { get; set; }
        public virtual Ward? Ward { get; set; }

    }
    public class City
    {
        public int Id { get; set; }
        public string Name { get; set; }

    }
    public class District
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CityId { get; set; }
        public List<City> Cities { get; set; } = new List<City>();

    }
    public class Ward
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DistrictId { get; set; }
        public List<District> Districts { get; set; } = new List<District>();

    }
}