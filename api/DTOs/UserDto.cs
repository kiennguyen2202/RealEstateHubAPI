using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using RealEstateHubAPI.Model;
using System.ComponentModel.DataAnnotations;
using RealEstateHubAPI.Migrations;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string? AvatarUrl { get; set; }
        public string Role { get; set; }
        public bool IsLocked { get; set; }
    }
}
