//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using RealEstateHubAPI.DTOs;
//using RealEstateHubAPI.Model;
//using Microsoft.EntityFrameworkCore;
//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.Extensions.Hosting;
//using Microsoft.AspNetCore.SignalR;
//using RealEstateHubAPI.Models;

//namespace RealEstateHubAPI.Controllers
//{
//    [ApiController]
//    [Route("api/messages")]
//    public class MessageController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly IHubContext<ChatHub> _chatHub;

//        public MessageController(ApplicationDbContext context, IHubContext<ChatHub> chatHub)
//        {
//            _context = context;
//            _chatHub = chatHub;
//        }

//        [HttpPost]
//        public async Task<IActionResult> Create([FromBody] CreateMessageDto dto)
//        {
//            if (!ModelState.IsValid)
//            {
//                return BadRequest(ModelState);
//            }

//            if (dto.SenderId == dto.ReceiverId)
//                return BadRequest("Người gửi và người nhận không được giống nhau.");

//            var sender = await _context.Users.FindAsync(dto.SenderId);
//            if (sender == null)
//                return BadRequest($"Không tìm thấy người gửi với ID: {dto.SenderId}");

//            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
//            if (receiver == null)
//                return BadRequest($"Không tìm thấy người nhận với ID: {dto.ReceiverId}");

//            var post = await _context.Posts.FindAsync(dto.PostId);
//            if (post == null)
//                return BadRequest($"Không tìm thấy bài đăng với ID: {dto.PostId}");

//            if (string.IsNullOrWhiteSpace(dto.Content))
//                return BadRequest("Nội dung tin nhắn không được để trống");

//            // Lưu tin nhắn vào database
//            var message = new RealEstateHubAPI.Model.Message
//            {
//                SenderId = dto.SenderId,
//                ReceiverId = dto.ReceiverId,
//                PostId = dto.PostId,
//                Content = dto.Content,
//                SentTime = DateTime.UtcNow
//            };

//            _context.Messages.Add(message);
//            await _context.SaveChangesAsync();

//            // Tạo conversation ID cho SignalR
//            var conversationId = $"post_{dto.PostId}_user_{dto.SenderId}_{dto.ReceiverId}";
            
//            // Tạo notification cho người nhận
//            var notification = new Notification
//            {
//                UserId = receiver.Id,
//                PostId = post.Id,
//                SenderId = sender.Id,
//                Title = "Tin nhắn mới",
//                Message = $"Có người gửi tin nhắn về bài đăng '{post.Title}'.",
//                Type = "message",
//                IsRead = false,
//                CreatedAt = DateTime.Now
//            };
//            _context.Notifications.Add(notification);
//            await _context.SaveChangesAsync();

//            // Gửi SignalR real-time
//            var messageDto = new MessageDto
//            {
//                Id = message.Id,
//                SenderId = sender.Id,
//                SenderName = sender.Name,
//                SenderAvatarUrl = sender.AvatarUrl,
//                ReceiverId = receiver.Id,
//                ReceiverName = receiver.Name,
//                ReceiverAvatarUrl = receiver.AvatarUrl,
//                PostId = post.Id,
//                PostTitle = post.Title,
//                PostUserName = (await _context.Users.FindAsync(post.UserId))?.Name,
//                Content = message.Content,
//                SentTime = message.SentTime
//            };

//            await _chatHub.Clients.Group(conversationId).SendAsync("ReceiveMessage", messageDto);

//            return Ok(messageDto);
//        }

//        [HttpGet("conversations/{userId}")]
//        public async Task<IActionResult> GetConversations(int userId)
//        {
//            var conversations = await _context.Messages
//                .Include(m => m.Sender)
//                .Include(m => m.Receiver)
//                .Include(m => m.Post)
//                .ThenInclude(p => p.User)
//                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
//                .GroupBy(m => new { m.PostId, OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId })
//                .Select(g => new ConversationDto
//                {
//                    PostId = g.Key.PostId,
//                    OtherUserId = g.Key.OtherUserId,
//                    PostTitle = g.First().Post.Title,
//                    PostUserName = g.First().Post.User.Name,
//                    OtherUserName = g.First().SenderId == userId ? g.First().Receiver.Name : g.First().Sender.Name,
//                    OtherUserAvatarUrl = g.First().SenderId == userId ? g.First().Receiver.AvatarUrl : g.First().Sender.AvatarUrl,
//                    LastMessage = new MessageDto
//                    {
//                        Id = g.OrderByDescending(m => m.SentTime).First().Id,
//                        SenderId = g.OrderByDescending(m => m.SentTime).First().SenderId,
//                        SenderName = g.OrderByDescending(m => m.SentTime).First().Sender.Name,
//                        ReceiverId = g.OrderByDescending(m => m.SentTime).First().ReceiverId,
//                        ReceiverName = g.OrderByDescending(m => m.SentTime).First().Receiver.Name,
//                        PostId = g.Key.PostId,
//                        PostTitle = g.First().Post.Title,
//                        Content = g.OrderByDescending(m => m.SentTime).First().Content,
//                        SentTime = g.OrderByDescending(m => m.SentTime).First().SentTime
//                    },
//                    MessageCount = g.Count(),
                    
//                })
//                .OrderByDescending(c => c.LastMessage.SentTime)
//                .ToListAsync();

//            return Ok(conversations);
//        }

//        [HttpGet("{user1Id}/{user2Id}/{postId}")]
//        public async Task<IActionResult> GetConversation(int user1Id, int user2Id, int postId)
//        {
//            var messages = await _context.Messages
//                .Include(m => m.Sender)
//                .Include(m => m.Receiver)
//                .Include(m => m.Post)
//                .ThenInclude(p => p.User)
//                .Where(m => m.PostId == postId &&
//                    ((m.SenderId == user1Id && m.ReceiverId == user2Id) ||
//                     (m.SenderId == user2Id && m.ReceiverId == user1Id)))
//                .OrderBy(m => m.SentTime)
//                .Select(m => new MessageDto
//                {
//                    Id = m.Id,
//                    SenderId = m.SenderId,
//                    SenderName = m.Sender.Name,
//                    SenderAvatarUrl = m.Sender.AvatarUrl,
//                    ReceiverId = m.ReceiverId,
//                    ReceiverName = m.Receiver.Name,
//                    ReceiverAvatarUrl = m.Receiver.AvatarUrl,
//                    PostId = m.PostId,
//                    PostTitle = m.Post.Title,
//                    PostUserName = m.Post.User.Name,
//                    Content = m.Content,
//                    SentTime = m.SentTime,
                    
//                })
//                .ToListAsync();

//            return Ok(messages);
//        }

//        // Quick replies enumeration for clients to consume
//        [HttpGet("quick-replies")]
//        public IActionResult GetQuickReplies()
//        {
//            var replies = new List<string>
//            {
//                "Căn hộ này còn không ạ?",
//                "Tình trạng giấy tờ như thế nào ạ?",
//                "Tôi có thể trả góp không?",
//                "Giá có thương lượng không ạ?"
//            };
//            return Ok(replies);
//        }

//        [HttpGet("user/{userId}")]
//        public async Task<IActionResult> GetUserMessages(int userId)
//        {
//            var messages = await _context.Messages
//                .Include(m => m.Sender)
//                .Include(m => m.Receiver)
//                .Include(m => m.Post)
//                .ThenInclude(p => p.User)
//                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
//                .OrderByDescending(m => m.SentTime)
//                .Select(m => new MessageDto
//                {
//                    Id = m.Id,
//                    SenderId = m.SenderId,
//                    SenderName = m.Sender.Name,
//                    SenderAvatarUrl = m.Sender.AvatarUrl,
//                    ReceiverId = m.ReceiverId,
//                    ReceiverName = m.Receiver.Name,
//                    ReceiverAvatarUrl = m.Receiver.AvatarUrl,
//                    PostId = m.PostId,
//                    PostTitle = m.Post.Title,
//                    PostUserName = m.Post.User.Name,
//                    Content = m.Content,
//                    SentTime = m.SentTime
//                })
//                .ToListAsync();

//            return Ok(messages);
//        }

//        [HttpPost("typing")]
//        public async Task<IActionResult> SendTypingIndicator([FromBody] TypingIndicatorDto dto)
//        {
//            var conversationId = $"post_{dto.PostId}_user_{dto.UserId}_{dto.OtherUserId}";
//            await _chatHub.Clients.Group(conversationId).SendAsync("UserTyping", dto.UserId, dto.IsTyping);
//            return Ok();
//        }

        

//        [HttpDelete("conversation")]
//        public async Task<IActionResult> DeleteConversation(int user1Id, int user2Id, int postId)
//        {
//            var messages = await _context.Messages
//                .Where(m => m.PostId == postId &&
//                    ((m.SenderId == user1Id && m.ReceiverId == user2Id) ||
//                     (m.SenderId == user2Id && m.ReceiverId == user1Id)))
//                .ToListAsync();

//            if (messages.Count == 0)
//                return NotFound("Không tìm thấy hội thoại để xóa.");

//            _context.Messages.RemoveRange(messages);
//            await _context.SaveChangesAsync();

//            return Ok(new { success = true, deleted = messages.Count });
//        }
//    }
//}
