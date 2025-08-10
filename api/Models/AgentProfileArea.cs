using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class AgentProfileArea
    {
        [Key]
        public int Id { get; set; }
        public int AgentProfileId { get; set; }
        public int AreaId { get; set; }

        public virtual AgentProfile AgentProfile { get; set; }
        public virtual Area Area { get; set; }
    }
}
