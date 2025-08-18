using Microsoft.DotNet.Scaffolding.Shared.CodeModifier.CodeChange;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using RealEstateHubAPI.Models;
using RestSharp;
using System.Security.Cryptography;
using System.Text;

namespace RealEstateHubAPI.Services
{
    public class MomoService : IMomoService
    {
        private readonly IOptions<MomoOptionModel> _options;
        public MomoService(IOptions<MomoOptionModel> options)
        {
            _options = options;
        }
        public async Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(OrderInfo model)
        {
            model.OrderId = DateTime.UtcNow.Ticks.ToString();
            // Preserve the original OrderInfomation to avoid breaking payment parsing
            // OrderInfomation already contains: "userId=123;plan=pro_month;previewId=456;type=membership"
            var orderInfo = model.OrderInfomation;
            Console.WriteLine($"MoMoService - Creating OrderInfo: {orderInfo}");
            
            var rawData =
                $"partnerCode={_options.Value.PartnerCode}" +
                $"&accessKey={_options.Value.AccessKey}" +
                $"&requestId={model.OrderId}" +
                $"&amount={model.Amount}" +
                $"&orderId={model.OrderId}" +
                $"&orderInfo={orderInfo}" +
                $"&returnUrl={_options.Value.ReturnUrl}" +
                $"&notifyUrl={_options.Value.NotifyUrl}" +
                $"&extraData=";

            var signature = ComputeHmacSha256(rawData, _options.Value.SecretKey);

            var client = new RestClient(_options.Value.MomoApiUrl);
            var request = new RestRequest() { Method = RestSharp.Method.Post };
            request.AddHeader("Content-Type", "application/json; charset=UTF-8");

            // Create an object representing the request data
            var requestData = new
            {
                accessKey = _options.Value.AccessKey,
                partnerCode = _options.Value.PartnerCode,
                requestType = _options.Value.RequestType,
                notifyUrl = _options.Value.NotifyUrl,
                returnUrl = _options.Value.ReturnUrl,
                orderId = model.OrderId,
                amount = model.Amount.ToString(),
                orderInfo = orderInfo,
                requestId = model.OrderId,
                extraData = "",
                signature = signature
            };

            request.AddParameter("application/json", JsonConvert.SerializeObject(requestData), ParameterType.RequestBody);

            var response = await client.ExecuteAsync(request);
            var momoResponse = JsonConvert.DeserializeObject<MomoCreatePaymentResponseModel>(response.Content);
            return momoResponse;

        }

        public MomoExecuteResponseModel PaymentExecuteAsync(IQueryCollection collection)
        {
            try
            {
                Console.WriteLine($"MoMo callback parameters: {string.Join(", ", collection.Select(kv => $"{kv.Key}={kv.Value}"))}");
                
                // MoMo callback parameters - handle both return and notify callbacks
                var resultCode = collection.FirstOrDefault(s => s.Key == "resultCode").Value.ToString();
                var amount = collection.FirstOrDefault(s => s.Key == "amount").Value.ToString();
                var orderInfo = collection.FirstOrDefault(s => s.Key == "orderInfo").Value.ToString();
                var orderId = collection.FirstOrDefault(s => s.Key == "orderId").Value.ToString();
                var message = collection.FirstOrDefault(s => s.Key == "message").Value.ToString();

                Console.WriteLine($"Parsed MoMo callback - resultCode: {resultCode}, amount: {amount}, orderInfo: {orderInfo}");

                // Check if payment was successful (resultCode = 0 means success)
                bool isSuccess = resultCode == "0";

                return new MomoExecuteResponseModel()
                {
                    Amount = amount,
                    OrderId = orderId,
                    OrderInfo = orderInfo,
                    Success = isSuccess,
                    Message = message
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing MoMo callback: {ex.Message}");
                Console.WriteLine($"Available parameters: {string.Join(", ", collection.Select(kv => kv.Key))}");
                return new MomoExecuteResponseModel()
                {
                    Success = false,
                    Message = "Error parsing callback"
                };
            }
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            byte[] hashBytes;

            using (var hmac = new HMACSHA256(keyBytes))
            {
                hashBytes = hmac.ComputeHash(messageBytes);
            }

            var hashString = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

            return hashString;
        }
    }

}
