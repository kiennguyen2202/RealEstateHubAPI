using System.ComponentModel.DataAnnotations;

namespace RealEstateHubAPI.Models
{
    public class AgentProfileCategory
    {
        [Key]
        public int Id { get; set; }
        public int AgentProfileId { get; set; }
        public int CategoryId { get; set; }

        public virtual AgentProfile AgentProfile { get; set; }
        public virtual Category Category { get; set; }
    }
}
