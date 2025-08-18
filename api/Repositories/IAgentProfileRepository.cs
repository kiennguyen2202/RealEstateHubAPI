using System.Collections.Generic;
using System.Threading.Tasks;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Repositories
{
    public interface IAgentProfileRepository
    {
        Task<IEnumerable<AgentProfile>> GetAllAsync();
        Task<AgentProfile> GetByIdAsync(int id);
        Task<AgentProfile> GetBySlugAsync(string slug);
        Task<AgentProfile> GetByUserIdAsync(int userId);
        Task<AgentProfile> AddAsync(AgentProfile agentProfile, List<int> areaIds, List<int> categoryIds, List<TransactionType> transactionTypes);
        Task<AgentProfile> UpdateAsync(AgentProfile agentProfile, List<int> areaIds, List<int> categoryIds, List<TransactionType> transactionTypes);
        Task<bool> DeleteAsync(int id);
    }
}
