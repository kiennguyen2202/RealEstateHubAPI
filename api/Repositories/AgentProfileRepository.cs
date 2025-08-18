using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using System;

namespace RealEstateHubAPI.Repositories
{
    public class AgentProfileRepository : IAgentProfileRepository
    {
        private readonly ApplicationDbContext _context;
        public AgentProfileRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AgentProfile>> GetAllAsync()
        {
            return await _context.AgentProfiles.Include(a => a.User)
                                                .Include(a => a.AgentProfileCategories)
                                                    .ThenInclude(apc => apc.Category)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.City)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.District)
                                                .Include(a => a.AgentProfileTransactionTypes).ToListAsync();
        }

        public async Task<AgentProfile> GetByIdAsync(int id)
        {
            return await _context.AgentProfiles.Include(a => a.User)
                                                .Include(a => a.AgentProfileCategories)
                                                    .ThenInclude(apc => apc.Category)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.City)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.District)
                                                .Include(a => a.AgentProfileTransactionTypes).FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<AgentProfile> GetBySlugAsync(string slug)
        {
            return await _context.AgentProfiles.Include(a => a.User)
                                                .Include(a => a.AgentProfileCategories)
                                                    .ThenInclude(apc => apc.Category)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.City)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.District)
                                                .Include(a => a.AgentProfileTransactionTypes).FirstOrDefaultAsync(a => a.Slug == slug);
        }

        public async Task<AgentProfile> GetByUserIdAsync(int userId)
        {
            return await _context.AgentProfiles.Include(a => a.User)
                                                .Include(a => a.AgentProfileCategories)
                                                    .ThenInclude(apc => apc.Category)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.City)
                                                .Include(a => a.AgentProfileAreas)
                                                    .ThenInclude(apa => apa.Area)
                                                        .ThenInclude(a => a.District)
                                                .Include(a => a.AgentProfileTransactionTypes)
                                                .OrderByDescending(a => a.Id)
                                                .FirstOrDefaultAsync(a => a.UserId == userId);
        }

        public async Task<AgentProfile> AddAsync(AgentProfile agentProfile, List<int> areaIds, List<int> categoryIds, List<TransactionType> transactionTypes)
        {
            try
            {
                _context.AgentProfiles.Add(agentProfile);
                await _context.SaveChangesAsync();

                foreach (var areaId in areaIds.Distinct())
                {
                    if (!agentProfile.AgentProfileAreas.Any(x => x.AreaId == areaId))
                    {
                        agentProfile.AgentProfileAreas.Add(new AgentProfileArea { AgentProfileId = agentProfile.Id, AreaId = areaId });
                    }
                }
                foreach (var categoryId in categoryIds.Distinct())
                {
                    if (!agentProfile.AgentProfileCategories.Any(x => x.CategoryId == categoryId))
                    {
                        agentProfile.AgentProfileCategories.Add(new AgentProfileCategory { AgentProfileId = agentProfile.Id, CategoryId = categoryId });
                    }
                }
                foreach (var transactionType in transactionTypes.Distinct())
                {
                    if (!agentProfile.AgentProfileTransactionTypes.Any(x => x.TransactionType == transactionType))
                    {
                        agentProfile.AgentProfileTransactionTypes.Add(new AgentProfileTransactionType { AgentProfileId = agentProfile.Id, TransactionType = transactionType });
                    }
                }

                await _context.SaveChangesAsync();
                return agentProfile;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Repository - Error saving agent: {ex.Message}");
                Console.WriteLine($"Repository - Inner exception: {ex.InnerException?.Message}");
                throw;
            }
        }

        public async Task<AgentProfile> UpdateAsync(AgentProfile agentProfile, List<int> areaIds, List<int> categoryIds, List<TransactionType> transactionTypes)
        {
            _context.AgentProfiles.Update(agentProfile);

            _context.AgentProfileAreas.RemoveRange(agentProfile.AgentProfileAreas);
            _context.AgentProfileCategories.RemoveRange(agentProfile.AgentProfileCategories);
            _context.AgentProfileTransactionTypes.RemoveRange(agentProfile.AgentProfileTransactionTypes);

            foreach (var areaId in areaIds)
            {
                agentProfile.AgentProfileAreas.Add(new AgentProfileArea { AgentProfileId = agentProfile.Id, AreaId = areaId });
            }
            foreach (var categoryId in categoryIds)
            {
                agentProfile.AgentProfileCategories.Add(new AgentProfileCategory { AgentProfileId = agentProfile.Id, CategoryId = categoryId });
            }
            foreach (var transactionType in transactionTypes)
            {
                agentProfile.AgentProfileTransactionTypes.Add(new AgentProfileTransactionType { AgentProfileId = agentProfile.Id, TransactionType = transactionType });
            }

            await _context.SaveChangesAsync();
            return agentProfile;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var agent = await _context.AgentProfiles.FindAsync(id);
            if (agent == null) return false;
            _context.AgentProfiles.Remove(agent);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
