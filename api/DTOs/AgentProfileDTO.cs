using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.DTOs
{
    public class AgentProfileDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ShopName { get; set; }
        public string Description { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string Address { get; set; }
        public string Slug { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<int> AreaIds { get; set; }
        public List<int> CategoryIds { get; set; }
        public List<string> TransactionTypes { get; set; }
        public string PhoneNumber { get; set; }
        public List<string> AreaNames { get; set; } 
    }
    public class CreateAgentProfileDTO
    {
        public string? UserId { get; set; }
        [Required]
        [MaxLength(100)]
        public string ShopName { get; set; }
        [MaxLength(500)]
        public string Description { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string Address { get; set; }
        [Required]
        [MaxLength(100)]
        public string Slug { get; set; }
        public List<int> AreaIds { get; set; }
        public List<int> CategoryIds { get; set; }
        public List<string> TransactionTypes { get; set; }
        [MaxLength(20)]
        public string PhoneNumber { get; set; }
    }
    public class UpdateAgentProfileDTO
    {
        [MaxLength(100)]
        public string ShopName { get; set; }
        [MaxLength(500)]
        public string Description { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string Address { get; set; }
        [MaxLength(100)]
        public string Slug { get; set; }
        public List<int> AreaIds { get; set; }
        public List<int> CategoryIds { get; set; }
        public List<string> TransactionTypes { get; set; }
        [MaxLength(20)]
        public string PhoneNumber { get; set; }
    }
}