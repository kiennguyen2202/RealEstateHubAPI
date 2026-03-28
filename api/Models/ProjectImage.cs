using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateHubAPI.Models
{
    public class ProjectImage
    {
        [Key]
        
        public int Id { get; set; }
        public int ProjectId { get; set; }
        
        public string Url { get; set; }
        
        public string? Caption { get; set; }
        public int Order { get; set; } = 0;

        public virtual Project Project { get; set; }
    }
}


