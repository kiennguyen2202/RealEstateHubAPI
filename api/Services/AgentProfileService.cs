using System.Collections.Generic;
using System.Threading.Tasks;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using System.Linq;
using System;
using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Services
{
    public class AgentProfileService : IAgentProfileService
    {
        private readonly IAgentProfileRepository _repo;
        public AgentProfileService(IAgentProfileRepository repo)
        {
            _repo = repo;
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
                    Address = dto.Address
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
            return new AgentProfileDTO
            {
                Id = a.Id,
                UserId = a.UserId,
                ShopName = a.ShopName,
                Description = a.Description,
                AvatarUrl = a.AvatarUrl,
                BannerUrl = a.BannerUrl,
                Slug = a.Slug,
                AreaIds = a.AgentProfileAreas.Select(apa => apa.AreaId).ToList(),
                CategoryIds = a.AgentProfileCategories.Select(apc => apc.CategoryId).ToList(),
                TransactionTypes = a.AgentProfileTransactionTypes.Select(aptt => aptt.TransactionType.ToString()).ToList(),
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                PhoneNumber = a.PhoneNumber,
                Address = a.Address,
                AreaNames = a.AgentProfileAreas.Select(apa => 
                    apa.Area != null && apa.Area.District != null ? 
                        $"{apa.Area.District.Name}, {apa.Area.City?.Name ?? "N/A"}" : 
                        "N/A"
                ).ToList()
            };  
        }
    }
}
