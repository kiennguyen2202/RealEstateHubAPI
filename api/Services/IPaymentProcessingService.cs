using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Services
{
    public interface IPaymentProcessingService
    {
        Task<(bool success, int? agentProfileId)> ProcessSuccessfulPayment(string orderInfo);
        
    }
}
