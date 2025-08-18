using System.Collections.Generic;
using System.Threading.Tasks;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public interface IAgentProfileService
    {
        Task<IEnumerable<AgentProfileDTO>> GetAllAsync();
        Task<AgentProfileDTO> GetByIdAsync(int id);
        Task<AgentProfileDTO> GetBySlugAsync(string slug);
        Task<AgentProfileDTO> GetByUserIdAsync(int userId);
        Task<AgentProfileDTO> CreateAsync(CreateAgentProfileDTO dto);
        Task<AgentProfileDTO> UpdateAsync(int id, UpdateAgentProfileDTO dto);
        Task<bool> DeleteAsync(int id);
    }
}