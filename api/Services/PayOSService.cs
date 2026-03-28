using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RealEstateHubAPI.Models;
using Microsoft.Extensions.Caching.Memory;

namespace RealEstateHubAPI.Services
{
    public class PayOSService : IPayOSService
    {
        private readonly PayOSSettings _settings;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private const string PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

        public PayOSService(IOptions<PayOSSettings> settings, HttpClient httpClient, IMemoryCache cache)
        {
            _settings = settings.Value;
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<string> CreatePaymentUrl(PaymentInformationModel model)
        {
            try
            {
                var orderCode = GenerateOrderCode();
                
                // Store orderInfo in cache for later retrieval
                var cacheKey = $"payos_order_{orderCode}";
                _cache.Set(cacheKey, model.OrderDescription, TimeSpan.FromHours(24));

                var expiredAt = (int)DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
                
                // Create signature data
                var signatureData = $"amount={model.Amount}&cancelUrl={_settings.CancelUrl}&description={TruncateDescription(model.OrderDescription)}&orderCode={orderCode}&returnUrl={_settings.ReturnUrl}";
                var signature = ComputeHmacSha256(signatureData, _settings.ChecksumKey);

                var requestBody = new PayOSCreatePaymentRequest
                {
                    orderCode = orderCode,
                    amount = (int)model.Amount,
                    description = TruncateDescription(model.OrderDescription),
                    buyerName = model.Name ?? "Customer",
                    buyerEmail = "",
                    buyerPhone = "",
                    buyerAddress = "",
                    items = new List<PayOSItem>
                    {
                        new PayOSItem
                        {
                            name = "Đăng ký dịch vụ",
                            quantity = 1,
                            price = (int)model.Amount
                        }
                    },
                    cancelUrl = _settings.CancelUrl,
                    returnUrl = _settings.ReturnUrl,
                    expiredAt = expiredAt,
                    signature = signature
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("x-client-id", _settings.ClientId);
                _httpClient.DefaultRequestHeaders.Add("x-api-key", _settings.ApiKey);

                var response = await _httpClient.PostAsync(PAYOS_API_URL, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"PayOS Response: {responseContent}");

                var payosResponse = JsonSerializer.Deserialize<PayOSCreatePaymentResponse>(responseContent);

                if (payosResponse?.code == "00" && payosResponse.data != null)
                {
                    return payosResponse.data.checkoutUrl;
                }
                else
                {
                    Console.WriteLine($"PayOS Error: {payosResponse?.desc}");
                    throw new Exception($"PayOS Error: {payosResponse?.desc ?? "Unknown error"}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PayOS CreatePaymentUrl Error: {ex.Message}");
                throw;
            }
        }


        public PayOSPaymentResult ProcessPaymentReturn(IQueryCollection query)
        {
            try
            {
                var code = query["code"].ToString();
                var id = query["id"].ToString();
                var cancel = query["cancel"].ToString();
                var status = query["status"].ToString();
                var orderCode = query["orderCode"].ToString();

                Console.WriteLine($"PayOS Return - code: {code}, status: {status}, orderCode: {orderCode}, cancel: {cancel}");

                // Get stored orderInfo from cache
                var cacheKey = $"payos_order_{orderCode}";
                var orderInfo = _cache.Get<string>(cacheKey) ?? "";

                if (code == "00" && status == "PAID" && cancel != "true")
                {
                    return new PayOSPaymentResult
                    {
                        Success = true,
                        Message = "Thanh toán thành công",
                        OrderCode = int.TryParse(orderCode, out var oc) ? oc : 0,
                        OrderInfo = orderInfo,
                        TransactionId = id
                    };
                }
                else if (cancel == "true")
                {
                    return new PayOSPaymentResult
                    {
                        Success = false,
                        Message = "Thanh toán đã bị hủy",
                        OrderCode = int.TryParse(orderCode, out var oc) ? oc : 0,
                        OrderInfo = orderInfo
                    };
                }
                else
                {
                    return new PayOSPaymentResult
                    {
                        Success = false,
                        Message = $"Thanh toán thất bại: {status}",
                        OrderCode = int.TryParse(orderCode, out var oc) ? oc : 0,
                        OrderInfo = orderInfo
                    };
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PayOS ProcessPaymentReturn Error: {ex.Message}");
                return new PayOSPaymentResult
                {
                    Success = false,
                    Message = $"Lỗi xử lý thanh toán: {ex.Message}"
                };
            }
        }

        public bool VerifyWebhookSignature(PayOSWebhookRequest webhookData)
        {
            try
            {
                if (webhookData.data == null) return false;

                var data = webhookData.data;
                var signatureData = $"amount={data.amount}&code={data.code}&desc={data.desc}&orderCode={data.orderCode}&paymentLinkId={data.paymentLinkId}";
                var computedSignature = ComputeHmacSha256(signatureData, _settings.ChecksumKey);

                return computedSignature == webhookData.signature;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PayOS VerifyWebhookSignature Error: {ex.Message}");
                return false;
            }
        }

        private int GenerateOrderCode()
        {
            // Generate a unique order code (max 9 digits for PayOS)
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var random = new Random().Next(100, 999);
            var orderCode = int.Parse($"{timestamp % 1000000}{random}");
            return Math.Abs(orderCode);
        }

        private string TruncateDescription(string description)
        {
            // PayOS description max 25 characters
            if (string.IsNullOrEmpty(description)) return "Thanh toan";
            return description.Length > 25 ? description.Substring(0, 25) : description;
        }

        private string ComputeHmacSha256(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }
}
