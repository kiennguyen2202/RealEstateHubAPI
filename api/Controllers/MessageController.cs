using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MessageController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMessageDto dto)
        {
            var sender = await _context.Users.FindAsync(dto.SenderId);
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
            var post = await _context.Posts.FindAsync(dto.PostId);

            if (sender == null || receiver == null || post == null)
                return BadRequest("Người gửi, người nhận hoặc bài đăng không tồn tại.");

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

            return Ok(message);
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
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.Receiver.Name,
                    PostId = m.PostId,
                    PostTitle = m.Post.Title,
                    Content = m.Content,
                    SentTime = m.SentTime
                })
                .ToListAsync();

            return Ok(messages);
        }
    }

}
