using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class PaymentHistory
    {
        [Key]
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string? Plan { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "VNPAY";
        public string? TransactionId { get; set; }
        public string? OrderInfo { get; set; }
        public string Status { get; set; } = "Pending";
        public string? PreviewId { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ProcessedAt { get; set; }
        public string? ErrorMessage { get; set; }
        
        
        public virtual User? User { get; set; }
    }
}
