namespace RealEstateHubAPI.DTOs
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; }
        public string SenderAvatarUrl { get; set; } 
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverAvatarUrl { get; set; }
        public int PostId { get; set; }
        public string PostTitle { get; set; }
        public int PostUserId { get; set; }
        public string PostUserName { get; set; }
        public string Content { get; set; }
        public DateTime SentTime { get; set; }
    }
    public class CreateMessageDto
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int PostId { get; set; }
        public string Content { get; set; }
    }

}
