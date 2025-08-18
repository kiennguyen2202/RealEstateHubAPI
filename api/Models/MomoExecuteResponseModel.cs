namespace RealEstateHubAPI.Models
{
    public class MomoExecuteResponseModel
    {
        public string OrderId { get; set; }
        public string Amount { get; set; }
        public string FullName { get; set; }
        public string OrderInfo { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
        public int? AgentProfileId { get; set; } // ID of the created agent profile
    }
}
