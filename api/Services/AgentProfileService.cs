using System.Collections.Generic;
using System.Threading.Tasks;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using System.Linq;
using System;
using RealEstateHubAPI.Model;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace RealEstateHubAPI.Services
{
    public class AgentProfileService : IAgentProfileService
    {
        private readonly IAgentProfileRepository _repo;
        private readonly ApplicationDbContext _context;
        
        public AgentProfileService(IAgentProfileRepository repo, ApplicationDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<IEnumerable<AgentProfileDTO>> GetAllAsync()
        {
            var agents = await _repo.GetAllAsync();
            var dtos = new List<AgentProfileDTO>();
            foreach (var a in agents)
            {
                dtos.Add(MapToDTO(a));
            }
            return dtos;
        }

        public async Task<AgentProfileDTO> GetByIdAsync(int id)
        {
            var agent = await _repo.GetByIdAsync(id);
            return agent == null ? null : MapToDTO(agent);
        }

        public async Task<AgentProfileDTO> GetBySlugAsync(string slug)
        {
            var agent = await _repo.GetBySlugAsync(slug);
            return agent == null ? null : MapToDTO(agent);
        }

        public async Task<AgentProfileDTO> GetByUserIdAsync(int userId)
        {
            var agent = await _repo.GetByUserIdAsync(userId);
            return agent == null ? null : MapToDTO(agent);
        }

        public async Task<AgentProfileDTO> CreateAsync(CreateAgentProfileDTO dto)
        {
            try
            {
                var agent = new AgentProfile
                {
                    UserId = dto.UserId != null ? int.Parse(dto.UserId) : 0,
                    ShopName = dto.ShopName,
                    Description = dto.Description,
                    AvatarUrl = dto.AvatarUrl,
                    BannerUrl = dto.BannerUrl,
                    Slug = dto.Slug,
                    CreatedAt = System.DateTime.UtcNow,
                    UpdatedAt = System.DateTime.UtcNow,
                    PhoneNumber = dto.PhoneNumber,
                    Address = dto.Address,
                    // Lưu AreaNames từ frontend dưới dạng JSON
                    AreaNamesJson = dto.AreaNames != null && dto.AreaNames.Count > 0 
                        ? JsonSerializer.Serialize(dto.AreaNames) 
                        : null,
                    // Lưu CategoryNames từ frontend dưới dạng JSON
                    CategoryNamesJson = dto.CategoryNames != null && dto.CategoryNames.Count > 0
                        ? JsonSerializer.Serialize(dto.CategoryNames)
                        : null,
                    // Lưu TransactionTypes từ frontend dưới dạng JSON
                    TransactionTypesJson = dto.TransactionTypes != null && dto.TransactionTypes.Count > 0
                        ? JsonSerializer.Serialize(dto.TransactionTypes)
                        : null
                };

                // Parse and deduplicate transaction types
                var parsedTransactionTypes = (dto.TransactionTypes ?? new List<string>())
                    .Select(t => Enum.Parse<TransactionType>(t, true))
                    .Distinct()
                    .ToList();

                var created = await _repo.AddAsync(
                    agent,
                    (dto.AreaIds ?? new List<int>()).Distinct().ToList(),
                    (dto.CategoryIds ?? new List<int>()).Distinct().ToList(),
                    parsedTransactionTypes
                );
                
                return MapToDTO(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Service - Error creating agent: {ex.Message}");
                Console.WriteLine($"Service - Inner exception: {ex.InnerException?.Message}");
                throw;
            }
        }

        public async Task<AgentProfileDTO> UpdateAsync(int id, UpdateAgentProfileDTO dto)
        {
            var agent = await _repo.GetByIdAsync(id);
            if (agent == null) return null;
            if (dto.ShopName != null) agent.ShopName = dto.ShopName;
            if (dto.Description != null) agent.Description = dto.Description;
            if (dto.AvatarUrl != null) agent.AvatarUrl = dto.AvatarUrl;
            if (dto.BannerUrl != null) agent.BannerUrl = dto.BannerUrl;
            if (dto.Slug != null) agent.Slug = dto.Slug;
            if (dto.PhoneNumber != null) agent.PhoneNumber = dto.PhoneNumber;
            if (dto.Address != null) agent.Address = dto.Address;
            agent.UpdatedAt = System.DateTime.UtcNow;
            var updated = await _repo.UpdateAsync(agent, dto.AreaIds, dto.CategoryIds, dto.TransactionTypes.Select(t => Enum.Parse<TransactionType>(t)).ToList());
            return MapToDTO(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }

        private AgentProfileDTO MapToDTO(AgentProfile a)
        {
            // Ưu tiên đọc AreaNames từ AreaNamesJson (đã lưu từ frontend)
            var areaNames = new List<string>();
            if (!string.IsNullOrEmpty(a.AreaNamesJson))
            {
                try
                {
                    areaNames = JsonSerializer.Deserialize<List<string>>(a.AreaNamesJson) ?? new List<string>();
                }
                catch
                {
                    areaNames = new List<string>();
                }
            }
            
            // Fallback: Tạo AreaNames từ AgentProfileAreas nếu chưa có
            if (areaNames.Count == 0 && a.AgentProfileAreas != null)
            {
                foreach (var apa in a.AgentProfileAreas)
                {
                    // AreaId trong AgentProfileArea là District ID/Code
                    var district = _context.Districts
                        .Include(d => d.City)
                        .FirstOrDefault(d => d.Id == apa.AreaId);
                    
                    if (district != null)
                    {
                        var cityName = district.City?.Name ?? "";
                        var districtName = district.Name ?? "";
                        if (!string.IsNullOrEmpty(districtName) && !string.IsNullOrEmpty(cityName))
                        {
                            areaNames.Add($"{districtName}, {cityName}");
                        }
                        else if (!string.IsNullOrEmpty(districtName))
                        {
                            areaNames.Add(districtName);
                        }
                    }
                }
            }

            // Ưu tiên đọc CategoryNames từ CategoryNamesJson
            var categoryNames = new List<string>();
            if (!string.IsNullOrEmpty(a.CategoryNamesJson))
            {
                try
                {
                    categoryNames = JsonSerializer.Deserialize<List<string>>(a.CategoryNamesJson) ?? new List<string>();
                }
                catch
                {
                    categoryNames = new List<string>();
                }
            }
            
            // Fallback: Tạo CategoryNames từ AgentProfileCategories nếu chưa có
            if (categoryNames.Count == 0 && a.AgentProfileCategories != null)
            {
                foreach (var apc in a.AgentProfileCategories)
                {
                    if (apc.Category != null)
                    {
                        categoryNames.Add(apc.Category.Name);
                    }
                }
            }

            // Ưu tiên đọc TransactionTypes từ TransactionTypesJson
            var transactionTypes = new List<string>();
            if (!string.IsNullOrEmpty(a.TransactionTypesJson))
            {
                try
                {
                    transactionTypes = JsonSerializer.Deserialize<List<string>>(a.TransactionTypesJson) ?? new List<string>();
                }
                catch
                {
                    transactionTypes = new List<string>();
                }
            }
            
            // Fallback: Tạo TransactionTypes từ AgentProfileTransactionTypes nếu chưa có
            if (transactionTypes.Count == 0 && a.AgentProfileTransactionTypes != null)
            {
                transactionTypes = a.AgentProfileTransactionTypes.Select(aptt => aptt.TransactionType.ToString()).ToList();
            }

            return new AgentProfileDTO
            {
                Id = a.Id,
                UserId = a.UserId,
                ShopName = a.ShopName,
                Description = a.Description,
                AvatarUrl = a.AvatarUrl,
                BannerUrl = a.BannerUrl,
                Slug = a.Slug,
                AreaIds = a.AgentProfileAreas?.Select(apa => apa.AreaId).ToList() ?? new List<int>(),
                CategoryIds = a.AgentProfileCategories?.Select(apc => apc.CategoryId).ToList() ?? new List<int>(),
                CategoryNames = categoryNames,
                TransactionTypes = transactionTypes,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                PhoneNumber = a.PhoneNumber,
                Address = a.Address,
                AreaNames = areaNames
            };  
        }
    }
}
