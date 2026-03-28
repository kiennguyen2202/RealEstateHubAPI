namespace RealEstateHubAPI.Models
{
    public class PayOSSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ChecksumKey { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }

    public class PayOSCreatePaymentRequest
    {
        public int orderCode { get; set; }
        public int amount { get; set; }
        public string description { get; set; } = string.Empty;
        public string buyerName { get; set; } = string.Empty;
        public string buyerEmail { get; set; } = string.Empty;
        public string buyerPhone { get; set; } = string.Empty;
        public string buyerAddress { get; set; } = string.Empty;
        public List<PayOSItem> items { get; set; } = new List<PayOSItem>();
        public string cancelUrl { get; set; } = string.Empty;
        public string returnUrl { get; set; } = string.Empty;
        public int expiredAt { get; set; }
        public string signature { get; set; } = string.Empty;
    }

    public class PayOSItem
    {
        public string name { get; set; } = string.Empty;
        public int quantity { get; set; }
        public int price { get; set; }
    }

    public class PayOSCreatePaymentResponse
    {
        public string code { get; set; } = string.Empty;
        public string desc { get; set; } = string.Empty;
        public PayOSPaymentData? data { get; set; }
        public string signature { get; set; } = string.Empty;
    }

    public class PayOSPaymentData
    {
        public string bin { get; set; } = string.Empty;
        public string accountNumber { get; set; } = string.Empty;
        public string accountName { get; set; } = string.Empty;
        public int amount { get; set; }
        public string description { get; set; } = string.Empty;
        public int orderCode { get; set; }
        public string currency { get; set; } = string.Empty;
        public string paymentLinkId { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string checkoutUrl { get; set; } = string.Empty;
        public string qrCode { get; set; } = string.Empty;
    }

    public class PayOSWebhookData
    {
        public int orderCode { get; set; }
        public int amount { get; set; }
        public string description { get; set; } = string.Empty;
        public string accountNumber { get; set; } = string.Empty;
        public string reference { get; set; } = string.Empty;
        public string transactionDateTime { get; set; } = string.Empty;
        public string currency { get; set; } = string.Empty;
        public string paymentLinkId { get; set; } = string.Empty;
        public string code { get; set; } = string.Empty;
        public string desc { get; set; } = string.Empty;
        public string counterAccountBankId { get; set; } = string.Empty;
        public string counterAccountBankName { get; set; } = string.Empty;
        public string counterAccountName { get; set; } = string.Empty;
        public string counterAccountNumber { get; set; } = string.Empty;
        public string virtualAccountName { get; set; } = string.Empty;
        public string virtualAccountNumber { get; set; } = string.Empty;
    }

    public class PayOSWebhookRequest
    {
        public string code { get; set; } = string.Empty;
        public string desc { get; set; } = string.Empty;
        public bool success { get; set; }
        public PayOSWebhookData? data { get; set; }
        public string signature { get; set; } = string.Empty;
    }

    public class PayOSPaymentResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int OrderCode { get; set; }
        public string OrderInfo { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public int? AgentProfileId { get; set; }
    }
}
