using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using Microsoft.AspNetCore.Http;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public interface IPostService
    {
        Task<Post> GetPostById(int id);
        Task<Post> CreatePost(Post post);
        Task<Post> UpdatePost(Post post);
        Task<bool> DeletePost(int id);
        
        Task<IEnumerable<Post>> GetPosts(string? category = null, string? transaction = null, 
            string? area = null, string? priceRange = null, string? sortBy = null);
        Task<bool> UploadPostImages(int postId, List<IFormFile> files);
        Task<IEnumerable<PostDto>> GetPostsByAgentProfileIdAsync(int agentProfileId);
    }
} 