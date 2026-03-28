namespace RealEstateHubAPI.DTOs
{
    public class TestPaymentHistoryDto
    {
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public string? Plan { get; set; }
        public string? PaymentMethod { get; set; }
    }
}
