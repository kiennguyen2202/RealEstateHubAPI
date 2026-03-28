using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.SignalR;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;

public class ExpireNotificationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private static DateTime _lastRunTime = DateTime.MinValue;

    public ExpireNotificationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Delay 5 phút trước khi chạy lần đầu
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndNotifyExpiredPosts(stoppingToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ExpireNotificationService error: {ex.Message}");
            }

            // Chạy mỗi 24 giờ
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task CheckAndNotifyExpiredPosts(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hub = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

        var now = DateTime.Now;
        var oneDayFromNow = now.AddDays(1);

        // Chỉ lấy bài đăng sắp hết hạn trong 24h tới VÀ chưa có notification trong 24h qua
        var soonExpiredPosts = await context.Posts
            .Where(p => p.ExpiryDate != null 
                && p.ExpiryDate > now 
                && p.ExpiryDate <= oneDayFromNow
                && p.IsApproved)
            .ToListAsync(stoppingToken);

        foreach (var post in soonExpiredPosts)
        {
            // Check xem đã có notification trong 24h qua chưa
            var recentNotification = await context.Notifications
                .Where(n => n.UserId == post.UserId 
                    && n.PostId == post.Id 
                    && n.Type == "expire"
                    && n.CreatedAt > now.AddHours(-24))
                .AnyAsync(stoppingToken);

            if (!recentNotification)
            {
                await CreateAndPushNotification(context, hub, new Notification
                {
                    UserId = post.UserId,
                    PostId = post.Id,
                    Title = "Bài đăng sắp hết hạn ⏰",
                    Message = $"Bài đăng '{post.Title}' sẽ hết hạn vào {post.ExpiryDate:dd/MM/yyyy HH:mm}.",
                    Type = "expire",
                    IsRead = false,
                    CreatedAt = now
                });
            }
        }

        // Bài đăng vừa hết hạn (trong 24h qua)
        var recentlyExpiredPosts = await context.Posts
            .Where(p => p.ExpiryDate != null 
                && p.ExpiryDate <= now 
                && p.ExpiryDate > now.AddHours(-24)
                && p.IsApproved)
            .ToListAsync(stoppingToken);

        foreach (var post in recentlyExpiredPosts)
        {
            var recentNotification = await context.Notifications
                .Where(n => n.UserId == post.UserId 
                    && n.PostId == post.Id 
                    && n.Type == "expired"
                    && n.CreatedAt > now.AddHours(-24))
                .AnyAsync(stoppingToken);

            if (!recentNotification)
            {
                await CreateAndPushNotification(context, hub, new Notification
                {
                    UserId = post.UserId,
                    PostId = post.Id,
                    Title = "Bài đăng đã hết hạn ❌",
                    Message = $"Bài đăng '{post.Title}' đã hết hạn.",
                    Type = "expired",
                    IsRead = false,
                    CreatedAt = now
                });
            }
        }

        _lastRunTime = now;
        Console.WriteLine($"ExpireNotificationService completed at {now}");
    }

    private async Task CreateAndPushNotification(ApplicationDbContext context, IHubContext<NotificationHub> hub, Notification notification)
    {
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        await hub.Clients.Group($"user_{notification.UserId}").SendAsync("ReceiveNotification", new
        {
            id = notification.Id,
            userId = notification.UserId,
            postId = notification.PostId,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            isRead = notification.IsRead,
            createdAt = notification.CreatedAt
        });

        Console.WriteLine($"📤 Sent {notification.Type} notification to user {notification.UserId}");
    }
}
