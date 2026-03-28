using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Services
{
    public interface IPayOSService
    {
        Task<string> CreatePaymentUrl(PaymentInformationModel model);
        PayOSPaymentResult ProcessPaymentReturn(IQueryCollection query);
        bool VerifyWebhookSignature(PayOSWebhookRequest webhookData);
    }
}
