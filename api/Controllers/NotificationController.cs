using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using Microsoft.AspNetCore.SignalR;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            if (dto == null || dto.UserId <= 0)
                return BadRequest("Invalid notification data");

            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title ?? "Thông báo",
                Message = dto.Message ?? "",
                Type = dto.Type ?? "info",
                PostId = dto.PostId,
                SenderId = dto.SenderId,
                CreatedAt = DateTime.Now,
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            Console.WriteLine($"✅ Created notification #{notification.Id} for user {notification.UserId}: {notification.Title}");

            // Push real-time via SignalR
            await PushNotificationToUser(notification);

            return Ok(notification);
        }

        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private async Task PushNotificationToUser(Notification notification)
        {
            var payload = new
            {
                id = notification.Id,
                userId = notification.UserId,
                senderId = notification.SenderId,
                postId = notification.PostId,
                title = notification.Title,
                message = notification.Message,
                type = notification.Type,
                isRead = notification.IsRead,
                createdAt = notification.CreatedAt
            };

            Console.WriteLine($"📤 Pushing notification to user_{notification.UserId}: {notification.Title}");

            await _hubContext.Clients.Group($"user_{notification.UserId}")
                .SendAsync("ReceiveNotification", payload);
        }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
        public int? PostId { get; set; }
        public int? SenderId { get; set; }
    }
}
