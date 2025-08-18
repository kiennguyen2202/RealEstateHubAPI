namespace RealEstateHubAPI.Models
{
    public class PaymentInformationModel
    {
        public string Name { get; set; } = string.Empty;
        public string OrderDescription { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string OrderType { get; set; } = "other";
        public int UserId { get; set; }
        public string? PreviewId { get; set; } // Preview ID for temporary profiles
    }
}


