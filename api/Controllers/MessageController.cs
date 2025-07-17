using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.SignalR;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub>   _hubContext;


        public MessageController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMessageDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (dto.SenderId == dto.ReceiverId)
                return BadRequest("Người gửi và người nhận không được giống nhau.");

            var sender = await _context.Users.FindAsync(dto.SenderId);
            if (sender == null)
                return BadRequest($"Không tìm thấy người gửi với ID: {dto.SenderId}");

            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiver == null)
                return BadRequest($"Không tìm thấy người nhận với ID: {dto.ReceiverId}");

            var post = await _context.Posts.FindAsync(dto.PostId);
            if (post == null)
                return BadRequest($"Không tìm thấy bài đăng với ID: {dto.PostId}");

            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest("Nội dung tin nhắn không được để trống");

            var message = new Message
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                PostId = dto.PostId,
                Content = dto.Content,
                SentTime = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Tạo notification cho người nhận
            var notification = new Notification
            {
                UserId = receiver.Id,
                PostId = post.Id,
                SenderId = sender.Id,
                Title = "Tin nhắn mới",
                Message = $"Có người gửi tin nhắn về bài đăng '{post.Title}'.",
                Type = "message",
                IsRead = false,
                CreatedAt = DateTime.Now
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Gửi SignalR real-time
            await _hubContext.Clients.User(receiver.Id.ToString()).SendAsync("ReceiveNotification", notification);

            return Ok(new MessageDto
            {
                Id = message.Id,
                SenderId = sender.Id,
                SenderName = sender.Name,
                ReceiverId = receiver.Id,
                ReceiverName = receiver.Name,
                PostId = post.Id,
                PostTitle = post.Title,
                PostUserId = post.UserId,
                PostUserName = (await _context.Users.FindAsync(post.UserId))?.Name,
                Content = message.Content,
                SentTime = message.SentTime
            });
        }


        [HttpGet("{user1Id}/{user2Id}/{postId}")]
        public async Task<IActionResult> GetConversation(int user1Id, int user2Id, int postId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Post)
                .Where(m => m.PostId == postId &&
                    ((m.SenderId == user1Id && m.ReceiverId == user2Id) ||
                     (m.SenderId == user2Id && m.ReceiverId == user1Id)))
                .OrderBy(m => m.SentTime)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    SenderAvatarUrl = m.Sender.AvatarUrl,
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.Receiver.Name,
                    ReceiverAvatarUrl = m.Receiver.AvatarUrl,
                    PostId = m.PostId,
                    PostTitle = m.Post.Title,
                    PostUserName = m.Post.User.Name,
                    Content = m.Content,
                    SentTime = m.SentTime
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserMessages(int userId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Post)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentTime)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    SenderAvatarUrl = m.Sender.AvatarUrl,
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.Receiver.Name,
                    ReceiverAvatarUrl = m.Receiver.AvatarUrl,
                    PostId = m.PostId,
                    PostTitle = m.Post.Title,
                    PostUserName = m.Post.User.Name,
                    Content = m.Content,
                    SentTime = m.SentTime
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetPostMessages(int postId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Post)
                .Where(m => m.PostId == postId)
                .OrderByDescending(m => m.SentTime)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    SenderAvatarUrl = m.Sender.AvatarUrl,
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.Receiver.Name,
                    ReceiverAvatarUrl = m.Receiver.AvatarUrl,  
                    PostId = m.PostId,
                    PostTitle = m.Post.Title,
                    PostUserName = m.Post.User.Name,
                    Content = m.Content,
                    SentTime = m.SentTime
                })
                .ToListAsync();

            return Ok(messages);
        }
        [HttpDelete("conversation")]
        public async Task<IActionResult> DeleteConversation(int user1Id, int user2Id, int postId)
        {
            var messages = await _context.Messages
                .Where(m => m.PostId == postId &&
                    ((m.SenderId == user1Id && m.ReceiverId == user2Id) ||
                     (m.SenderId == user2Id && m.ReceiverId == user1Id)))
                .ToListAsync();

            if (messages.Count == 0)
                return NotFound("Không tìm thấy hội thoại để xóa.");

            _context.Messages.RemoveRange(messages);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, deleted = messages.Count });
        }
    }
}
