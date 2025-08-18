using RealEstateHubAPI.Models;
using Microsoft.AspNetCore.Http;
namespace RealEstateHubAPI.Services
{
    public interface IMomoService
    {
        Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(OrderInfo model);
        MomoExecuteResponseModel PaymentExecuteAsync(IQueryCollection collection);

    }
}
