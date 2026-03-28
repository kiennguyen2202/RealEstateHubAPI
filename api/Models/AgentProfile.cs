using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class AgentProfile
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public int CategoryId { get; set; }

        public int AreaId { get; set; }

        public string ShopName { get; set; }

        public string Description { get; set; }

        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        
        // Lưu AreaNames dưới dạng JSON string để tránh phụ thuộc vào Districts table
        public string? AreaNamesJson { get; set; }
        
        // Lưu CategoryNames dưới dạng JSON string
        public string? CategoryNamesJson { get; set; }
        
        // Lưu TransactionTypes dưới dạng JSON string
        public string? TransactionTypesJson { get; set; }

        public string Slug { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public virtual User? User { get; set; }
        public virtual List<AgentProfileTransactionType> AgentProfileTransactionTypes { get; set; } = new List<AgentProfileTransactionType>();
        public virtual List<AgentProfileArea> AgentProfileAreas { get; set; } = new List<AgentProfileArea>();
        public virtual List<AgentProfileCategory> AgentProfileCategories { get; set; } = new List<AgentProfileCategory>();

    }
}