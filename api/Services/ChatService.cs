using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using RealEstateHubAPI.Model;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;

namespace RealEstateHubAPI.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        
        private readonly IConfiguration _configuration;

        public ChatService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<string> GenerateUserTokenAsync(int userId, string userName, string? userImage)
        {
            try
            {
                // Generate Stream Chat user token (JWT signed with Stream API secret)
                var apiSecret = _configuration["StreamChat:ApiSecret"];
                if (string.IsNullOrWhiteSpace(apiSecret))
                {
                    throw new Exception("StreamChat ApiSecret is not configured");
                }

                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret));
                var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                var claims = new List<Claim>
                {
                    new Claim("user_id", userId.ToString())
                };

                // Stream tokens can be long-lived; set a distant expiration if desired
                var jwt = new JwtSecurityToken(
                    claims: claims,
                    notBefore: DateTime.UtcNow.AddMinutes(-5),
                    expires: DateTime.UtcNow.AddYears(1),
                    signingCredentials: credentials
                );

                var token = new JwtSecurityTokenHandler().WriteToken(jwt);
                return token;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to generate token: {ex.Message}");
            }
        }

        public async Task EnsureUsersExistAsync(IEnumerable<int> userIds)
        {
            var apiKey = _configuration["StreamChat:ApiKey"];
            var apiSecret = _configuration["StreamChat:ApiSecret"];
            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
                throw new Exception("StreamChat ApiKey/ApiSecret not configured");

            // Minimal server auth: Stream supports using server token (JWT signed with secret) where claim user_id is not required
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var serverToken = new JwtSecurityToken(signingCredentials: credentials);
            var auth = new JwtSecurityTokenHandler().WriteToken(serverToken);

            using var http = new HttpClient { BaseAddress = new Uri("https://chat.stream-io-api.com/") };
            // For Stream server-side auth, send raw JWT in Authorization header (no "Bearer " prefix)
            http.DefaultRequestHeaders.Remove("Authorization");
            http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);
            http.DefaultRequestHeaders.Remove("stream-auth-type");
            http.DefaultRequestHeaders.TryAddWithoutValidation("stream-auth-type", "jwt");

            // Build upsert users payload
            var usersObj = new Dictionary<string, object>();
            string ToAbsolute(string? path)
            {
                if (string.IsNullOrWhiteSpace(path)) return string.Empty;
                if (path.StartsWith("http://") || path.StartsWith("https://")) return path;
                var trimmed = path.TrimStart('/');
                // Prefer configured PublicBaseUrl if available, fallback to localhost
                var baseUrl = _configuration["PublicBaseUrl"];
                if (string.IsNullOrWhiteSpace(baseUrl)) baseUrl = "http://localhost:5134";
                return $"{baseUrl}/{trimmed}";
            }
            foreach (var id in userIds.Distinct())
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) continue;
                usersObj[id.ToString()] = new
                {
                    id = id.ToString(),
                    name = user.Name,
                    image = string.IsNullOrEmpty(user.AvatarUrl) ? null : ToAbsolute(user.AvatarUrl)
                };
            }

            if (!usersObj.Any()) return;

            var body = new
            {
                users = usersObj
            };

            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var resp = await http.PostAsync($"users?api_key={apiKey}", content);
            if (!resp.IsSuccessStatusCode)
            {
                var text = await resp.Content.ReadAsStringAsync();
                throw new Exception($"Ensure users failed: {(int)resp.StatusCode} {text}");
            }
        }
        public async Task DeleteChannelAsync(string channelType, string channelId, bool hardDelete = true)
        {
            var apiKey = _configuration["StreamChat:ApiKey"];
            var apiSecret = _configuration["StreamChat:ApiSecret"];
            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
                throw new Exception("StreamChat ApiKey/ApiSecret not configured");

            // Server token for Stream admin operations
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var serverToken = new JwtSecurityToken(signingCredentials: credentials);
            var auth = new JwtSecurityTokenHandler().WriteToken(serverToken);

            using var http = new HttpClient { BaseAddress = new Uri("https://chat.stream-io-api.com/") };
            http.DefaultRequestHeaders.Remove("Authorization");
            http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);
            http.DefaultRequestHeaders.Remove("stream-auth-type");
            http.DefaultRequestHeaders.TryAddWithoutValidation("stream-auth-type", "jwt");

            var body = new { hard_delete = hardDelete };
            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var resp = await http.DeleteAsync($"channels/{channelType}/{channelId}?api_key={apiKey}");
            if (!resp.IsSuccessStatusCode)
            {
                var text = await resp.Content.ReadAsStringAsync();
                throw new Exception($"Delete channel failed: {(int)resp.StatusCode} {text}");
            }
        }
        
    }
}
