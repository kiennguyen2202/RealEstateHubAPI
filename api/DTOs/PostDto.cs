using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using RealEstateHubAPI.Model;
using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Migrations;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.DTOs
{
    public class CreatePostDto
    {
        [Required]
        public string Title { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public decimal Price { get; set; }
        
        [Required]
        public PriceUnit PriceUnit { get; set; }
        [Required]
        public TransactionType TransactionType  { get; set; }
        [Required]
        public string Status { get; set; }
        [Required]
        public string Street_Name { get; set; }
        [Required]
        public float Area_Size { get; set; }

        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int AreaId { get; set; }
        public int UserId { get; set; }

        [Required]
        public IFormFile[] Images { get; set; }
    }
    public class UpdatePostDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string Title { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public decimal Price { get; set; }

        [Required]
        public PriceUnit PriceUnit { get; set; }
        [Required]
        public TransactionType TransactionType { get; set; }
        [Required]
        public string Status { get; set; }
        [Required]
        public string Street_Name { get; set; }
        [Required]
        public float Area_Size { get; set; }

        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int AreaId { get; set; }
        public int UserId { get; set; }

        public IFormFile[]? Images { get; set; } 
       
    }
}
