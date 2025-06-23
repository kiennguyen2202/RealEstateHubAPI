using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace RealEstateHubAPI.Models
{
    public class PaymentConfirmation
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int UserId { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Phone { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string PaymentMethod { get; set; }
        public string ReceiptUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class PaymentConfirmationDto
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Phone { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string PaymentMethod { get; set; }
        public IFormFile Receipt { get; set; }
    }
} 