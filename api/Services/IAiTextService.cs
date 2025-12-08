using System.Threading.Tasks;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public interface IAiTextService
    {
        Task<(string title, string description)> GenerateListingAsync(AiGenerateListingDto dto, CancellationToken cancellationToken = default);
    }
}

