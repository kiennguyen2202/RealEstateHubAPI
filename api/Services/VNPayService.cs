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

        private string RemoveVietnameseDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            
            // Only allow alphanumeric, spaces, and basic punctuation
            var normalized = text.Normalize(System.Text.NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in normalized)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    // Only keep ASCII printable characters
                    if (c <= 127)
                    {
                        sb.Append(c);
                    }
                }
            }
            return sb.ToString();
        }


        public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
        {
            var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById(_configuration["TimeZoneId"]);
            var timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);
            var txnRef = DateTime.Now.ToString("yyyyMMddHHmmss");
            var pay = new VnPayLibrary();
            var urlCallBack = _configuration["PaymentCallBack:ReturnUrl"];

            // Log config values
            Console.WriteLine($"VNPayService - TmnCode: {_configuration["Vnpay:TmnCode"]}");
            Console.WriteLine($"VNPayService - HashSecret: {_configuration["Vnpay:HashSecret"]}");
            Console.WriteLine($"VNPayService - ReturnUrl: {urlCallBack}");

            pay.AddRequestData("vnp_Version", _configuration["Vnpay:Version"]);
            pay.AddRequestData("vnp_Command", _configuration["Vnpay:Command"]);
            pay.AddRequestData("vnp_TmnCode", _configuration["Vnpay:TmnCode"]);
            pay.AddRequestData("vnp_Amount", ((int)model.Amount * 100).ToString());
            pay.AddRequestData("vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss"));
            pay.AddRequestData("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);
            pay.AddRequestData("vnp_IpAddr", pay.GetIpAddress(context));
            pay.AddRequestData("vnp_Locale", _configuration["Vnpay:Locale"]);

            // Create OrderInfo - remove special characters to avoid signature issues
            var orderInfo = model.OrderDescription;
            orderInfo = RemoveVietnameseDiacritics(orderInfo);
            Console.WriteLine($"VNPayService - Creating OrderInfo: {orderInfo}");
            pay.AddRequestData("vnp_OrderInfo", orderInfo);
            pay.AddRequestData("vnp_OrderType", model.OrderType);
            pay.AddRequestData("vnp_ReturnUrl", urlCallBack);
            pay.AddRequestData("vnp_TxnRef", txnRef);

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



