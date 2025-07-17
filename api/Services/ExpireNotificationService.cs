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

    public ExpireNotificationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                // Sắp hết hạn
                var soonExpiredPosts = await context.Posts
                    .Where(p => p.ExpiryDate != null && p.ExpiryDate > DateTime.Now && p.ExpiryDate <= DateTime.Now.AddDays(1))
                    .ToListAsync();

                foreach (var post in soonExpiredPosts)
                {
                    bool alreadyNotified = await context.Notifications.AnyAsync(n =>
                        n.UserId == post.UserId &&
                        n.PostId == post.Id &&
                        n.Type == "expire"
                    );

                    if (!alreadyNotified)
                    {
                        var notification = new Notification
                        {
                            UserId = post.UserId,
                            PostId = post.Id,
                            Title = "Bài đăng sắp hết hạn",
                            Message = $"Bài đăng '{post.Title}' của bạn sẽ hết hạn vào {post.ExpiryDate:dd/MM/yyyy}.",
                            Type = "expire",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        };
                        context.Notifications.Add(notification);
                        await context.SaveChangesAsync();
                        await hub.Clients.User(post.UserId.ToString()).SendAsync("ReceiveNotification", notification);
                    }
                }

                // Đã hết hạn
                var expiredPosts = await context.Posts
                    .Where(p => p.ExpiryDate != null && p.ExpiryDate <= DateTime.Now)
                    .ToListAsync();

                foreach (var post in expiredPosts)
                {
                    bool alreadyNotified = await context.Notifications.AnyAsync(n =>
                        n.UserId == post.UserId &&
                        n.PostId == post.Id &&
                        n.Type == "expired"
                    );

                    if (!alreadyNotified)
                    {
                        var notification = new Notification
                        {
                            UserId = post.UserId,
                            PostId = post.Id,
                            Title = "Bài đăng đã hết hạn",
                            Message = $"Bài đăng '{post.Title}' của bạn đã hết hạn.",
                            Type = "expired",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        };
                        context.Notifications.Add(notification);
                        await context.SaveChangesAsync();
                        await hub.Clients.User(post.UserId.ToString()).SendAsync("ReceiveNotification", notification);
                    }
                }
            }

            await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
        }
    }
}