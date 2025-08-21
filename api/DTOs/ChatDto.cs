namespace RealEstateHubAPI.DTOs
{
    public class ChatTokenRequest
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string? UserImage { get; set; }
    }

    public class ChatTokenResponse
    {
        public string Token { get; set; }
        public string ApiKey { get; set; }
    }


    public class EnsureUsersRequest
    {
        public List<int> UserIds { get; set; }
    }
}
