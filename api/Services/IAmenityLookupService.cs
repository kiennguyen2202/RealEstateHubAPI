using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public interface IAmenityLookupService
    {
        Task<IReadOnlyList<AmenityInfo>> GetNearbyAmenitiesAsync(string? address, CancellationToken cancellationToken = default);
    }
}

