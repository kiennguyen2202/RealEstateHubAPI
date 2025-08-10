using System.ComponentModel.DataAnnotations;

namespace RealEstateHubAPI.Models
{
    public class AgentProfileTransactionType
    {
        [Key]
        public int Id { get; set; }
        public int AgentProfileId { get; set; }
        public TransactionType TransactionType { get; set; }

        public virtual AgentProfile AgentProfile { get; set; }
    }
}
