using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using RealEstateHubAPI.Libraries;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Services
{
    public class VNPayService : IVNPayService
    {
        private readonly IConfiguration _configuration;


        public VNPayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }


        public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
        {
            var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById(_configuration["TimeZoneId"]);
            var timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);
            var tick = DateTime.Now.Ticks.ToString();
            var pay = new VnPayLibrary();
            var urlCallBack = _configuration["PaymentCallBack:ReturnUrl"];

            pay.AddRequestData("vnp_Version", _configuration["Vnpay:Version"]);
            pay.AddRequestData("vnp_Command", _configuration["Vnpay:Command"]);
            pay.AddRequestData("vnp_TmnCode", _configuration["Vnpay:TmnCode"]);
            pay.AddRequestData("vnp_Amount", ((int)model.Amount * 100).ToString());
            pay.AddRequestData("vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss"));
            pay.AddRequestData("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);
            pay.AddRequestData("vnp_IpAddr", pay.GetIpAddress(context));
            pay.AddRequestData("vnp_Locale", _configuration["Vnpay:Locale"]);

            // Create OrderInfo using only OrderDescription to avoid parsing issues
            // OrderDescription example : "userId=123;plan=pro_month;previewId=456;type=membership"

            var orderInfo = model.OrderDescription;
            Console.WriteLine($"VNPayService - Creating OrderInfo: {orderInfo}");
            pay.AddRequestData("vnp_OrderInfo", orderInfo);
            pay.AddRequestData("vnp_OrderType", model.OrderType);
            pay.AddRequestData("vnp_ReturnUrl", urlCallBack);
            pay.AddRequestData("vnp_TxnRef", tick);

            var paymentUrl =
                pay.CreateRequestUrl(_configuration["Vnpay:BaseUrl"], _configuration["Vnpay:HashSecret"]);

            return paymentUrl;
        }

    
        public PaymentResponseModel PaymentExecute(IQueryCollection collections)
        {
            var pay = new VnPayLibrary();
            var response = pay.GetFullResponseData(collections, _configuration["Vnpay:HashSecret"]);

            // Log the response for debugging
            Console.WriteLine($"VNPayService PaymentExecute - Success: {response.Success}, OrderInfo: {response.OrderInfo}, OrderDescription: {response.OrderDescription}");

            return response;
        }


    }
}



