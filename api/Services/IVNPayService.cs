using Microsoft.AspNetCore.Http;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Services
{
    public interface IVNPayService
    {
        string CreatePaymentUrl(PaymentInformationModel model, HttpContext context);
        PaymentResponseModel PaymentExecute(IQueryCollection collections);
    }
}
