using RealEstateHubAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using RealEstateHubAPI.Model;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public class PaymentProcessingService : IPaymentProcessingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentProcessingService> _logger;
        private readonly IMemoryCache _cache;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IAgentProfileService _agentProfileService;

        public PaymentProcessingService(
            ApplicationDbContext context, 
            ILogger<PaymentProcessingService> logger,
            IMemoryCache cache,
            IWebHostEnvironment webHostEnvironment,
            IAgentProfileService agentProfileService)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
            _webHostEnvironment = webHostEnvironment;
            _agentProfileService = agentProfileService;
        }

        public async Task<(bool success, int? agentProfileId)> ProcessSuccessfulPayment(string orderInfo)
        {
            try
            {
                _logger.LogInformation($"Processing successful payment with orderInfo: {orderInfo}");

                // Extract userId, plan, previewId, and amount from orderInfo
                var userId = ExtractUserId(orderInfo);
                var plan = ExtractPlan(orderInfo);
                var previewId = ExtractPreviewId(orderInfo);
                var previewIdString = ExtractPreviewIdAsString(orderInfo);
                var amount = ExtractAmount(orderInfo);

                _logger.LogInformation($"Extracted from orderInfo - UserId: {userId}, Plan: {plan}, PreviewId: {previewId}, PreviewIdString: {previewIdString}, Amount: {amount}");

                int? createdAgentProfileId = null;

                // Update user role to Membership 
                if (userId.HasValue)
                {
                    _logger.LogInformation($"Starting membership upgrade for user {userId.Value}");
                    var success = await UpgradeUserToMembership(userId.Value, plan);
                    if (success)
                    {
                        _logger.LogInformation($"Successfully upgraded user {userId.Value} to Membership");
                    }
                    else
                    {
                        _logger.LogError($"Failed to upgrade user {userId.Value} to Membership");
                    }
                }
                else
                {
                    _logger.LogError($"Failed to extract userId from orderInfo: {orderInfo}");
                }

                // Commit agent profile if this is an agent profile payment
                if (!string.IsNullOrEmpty(previewIdString))
                {
                    _logger.LogInformation($"Starting agent profile commit for previewId: {previewIdString}");
                    var (commitSuccess, agentProfileId) = await CommitAgentProfile(previewIdString);
                    if (commitSuccess)
                    {
                        _logger.LogInformation($"Successfully committed agent profile with previewId: {previewIdString}, new agent profile ID: {agentProfileId}");
                        createdAgentProfileId = agentProfileId;
                    }
                    else
                    {
                        _logger.LogError($"Failed to commit agent profile with previewId: {previewIdString}");
                    }
                }
                else if (previewId.HasValue)
                {
                    _logger.LogInformation($"Starting agent profile commit for numeric previewId: {previewId.Value}");
                    var (commitSuccess, agentProfileId) = await CommitAgentProfile(previewId.Value.ToString());
                    if (commitSuccess)
                    {
                        _logger.LogInformation($"Successfully committed agent profile with numeric previewId: {previewId.Value}, new agent profile ID: {agentProfileId}");
                        createdAgentProfileId = agentProfileId;
                    }
                    else
                    {
                        _logger.LogError($"Failed to commit agent profile with numeric previewId: {previewId.Value}");
                    }
                }
                else
                {
                    _logger.LogInformation($"No agent profile to commit - this is a membership-only payment");
                }

                // Save payment history
                if (userId.HasValue)
                {
                    _logger.LogInformation($"Starting to save payment history for user {userId.Value}");
                    // Add transaction type to orderInfo for better tracking
                    var enhancedOrderInfo = $"{orderInfo};transactionType={(!string.IsNullOrEmpty(previewIdString) ? "agent_profile" : "membership")}";
                    
                    // Parse amount safely from string
                    decimal parsedAmount = 0;
                    if (!string.IsNullOrEmpty(amount))
                    {
                        if (decimal.TryParse(amount, out decimal tempAmount))
                        {
                            parsedAmount = tempAmount;
                        }
                        else
                        {
                            _logger.LogWarning($"Failed to parse amount: {amount}, using 0 as default");
                        }
                    }
                    
                    var paymentHistory = new PaymentHistory
                    {
                        UserId = userId.Value,
                        Amount = parsedAmount,
                        CreatedAt = DateTime.Now,
                        Status = "Success",
                        PreviewId = previewIdString,
                        OrderInfo = enhancedOrderInfo,
                        PaymentMethod = "VNPAY",
                        TransactionId = Guid.NewGuid().ToString()
                    };

                    _context.PaymentHistories.Add(paymentHistory);
                    var saveResult = await _context.SaveChangesAsync();
                    _logger.LogInformation($"Payment history saved for user {userId.Value}, save result: {saveResult}");

                    // Create notifications for successful payment
                    _logger.LogInformation($"Starting to create notifications for user {userId.Value}");
                    await CreatePaymentNotifications(userId.Value, plan, previewIdString, createdAgentProfileId);
                }
                else
                {
                    _logger.LogWarning($"Cannot save payment history or create notifications - userId is null");
                }

                // Fallback: if agent profile ID is still null,find by userId 
                if (createdAgentProfileId == null && userId.HasValue)
                {
                    try
                    {
                        _logger.LogInformation($"Attempting fallback lookup for agent profile by userId {userId.Value}");
                        var existingAgentId = await _context.AgentProfiles
                            .AsNoTracking()
                            .Where(a => a.UserId == userId.Value)
                            .OrderByDescending(a => a.Id)
                            .Select(a => a.Id)
                            .FirstOrDefaultAsync();

                        if (existingAgentId > 0)
                        {
                            createdAgentProfileId = existingAgentId;
                            _logger.LogInformation($"Fallback found existing agent profile for user {userId.Value} with ID {existingAgentId}");
                        }
                        else
                        {
                            _logger.LogInformation($"No existing agent profile found for user {userId.Value} in fallback lookup");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Fallback lookup for agent profile by userId {userId.Value} failed: {ex.Message}");
                    }
                }

                _logger.LogInformation($"Payment processing completed successfully for user {userId}, returning agentProfileId: {createdAgentProfileId}");
                return (true, createdAgentProfileId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing successful payment: {ex.Message}");
                
                return (false, null);
            }
        }

        

        private int? ExtractUserId(string orderDesc)
        {
            _logger.LogInformation($"Extracting userId from: {orderDesc}");
            
            if (orderDesc.Contains("userId="))
            {
                var userIdMatch = Regex.Match(orderDesc, @"userId=(\d+)");
                _logger.LogInformation($"UserId regex match: {userIdMatch.Success}");
                
                if (userIdMatch.Success && int.TryParse(userIdMatch.Groups[1].Value, out int parsedUserId))
                {
                    _logger.LogInformation($"Successfully extracted userId: {parsedUserId}");
                    return parsedUserId;
                }
                else
                {
                    _logger.LogWarning($"Failed to parse userId from: {userIdMatch.Groups[1].Value}");
                }
            }
            else
            {
                _logger.LogWarning($"orderDesc does not contain 'userId=': {orderDesc}");
            }
            return null;
        }

        private string ExtractPlan(string orderDesc)
        {
            if (orderDesc.Contains("plan="))
            {
                var planMatch = Regex.Match(orderDesc, @"plan=([^;]+)");
                if (planMatch.Success)
                {
                    return planMatch.Groups[1].Value;
                }
            }
            return "";
        }

        private int? ExtractPreviewId(string orderDesc)
        {
            _logger.LogInformation($"Extracting previewId from: {orderDesc}");
            
            if (orderDesc.Contains("previewId="))
            {
                var previewIdMatch = Regex.Match(orderDesc, @"previewId=([^;]+)");
                _logger.LogInformation($"PreviewId regex match: {previewIdMatch.Success}");
                
                if (previewIdMatch.Success)
                {
                    var previewIdStr = previewIdMatch.Groups[1].Value.Trim();
                    _logger.LogInformation($"Extracted previewId string: '{previewIdStr}'");
                    
                    // Try to parse as int first (for numeric IDs)
                    if (int.TryParse(previewIdStr, out int numericId))
                    {
                        _logger.LogInformation($"Successfully parsed numeric previewId: {numericId}");
                        return numericId;
                    }
                    
                    // If it's a GUID string, we'll use it as is
                    _logger.LogInformation($"Using previewId as string: {previewIdStr}");
                    return null; // We'll handle GUID strings differently
                }
                else
                {
                    _logger.LogWarning($"Failed to match previewId regex in: {orderDesc}");
                }
            }
            else
            {
                _logger.LogWarning($"orderDesc does not contain 'previewId=': {orderDesc}");
            }
            return null;
        }

        private string? ExtractPreviewIdAsString(string orderDesc)
        {
            _logger.LogInformation($"Extracting previewId as string from: {orderDesc}");
            
            if (orderDesc.Contains("previewId="))
            {
                var previewIdMatch = Regex.Match(orderDesc, @"previewId=([^;]+)");
                if (previewIdMatch.Success)
                {
                    var previewId = previewIdMatch.Groups[1].Value.Trim();
                    _logger.LogInformation($"Extracted previewId string: '{previewId}'");
                    return previewId;
                }
            }
            return null;
        }

        private string? ExtractAmount(string orderInfo)
        {
            // Amount is the last numeric token; try to find the last number in the string
            var match = Regex.Matches(orderInfo, @"(\d+)");
            if (match.Count > 0)
            {
                return match[^1].Value; // last match
            }
            return null;
        }

        private async Task SavePaymentHistory(int userId, string userName, string plan, string amount, string orderInfo, string? previewId)
        {
            try
            {
                _logger.LogInformation($"Saving payment history - UserId: {userId}, Amount: {amount}, PreviewId: {previewId}");
                
                // Try to parse amount safely
                if (!decimal.TryParse(amount, out decimal parsedAmount))
                {
                    _logger.LogWarning($"Failed to parse amount: {amount}, using 0 as default");
                    parsedAmount = 0;
                }
                
                var paymentHistory = new PaymentHistory
                {
                    UserId = userId,
                    UserName = userName,
                    Plan = plan,
                    Amount = parsedAmount,
                    PaymentMethod = "VNPAY",
                    TransactionId = Guid.NewGuid().ToString(), // get this from VNPAY response
                    OrderInfo = orderInfo,
                    Status = "Success",
                    PreviewId = previewId,
                    ProcessedAt = DateTime.Now
                };

                _context.PaymentHistories.Add(paymentHistory);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment history saved for user {userId} with amount {parsedAmount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving payment history for user {userId}: {ex.Message}");
            }
        }

        private async Task<bool> UpgradeUserToMembership(int userId, string plan)
        {
            try
            {
                _logger.LogInformation($"Attempting to upgrade user {userId} to Membership with plan: {plan}");
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return false;
                }
                
                _logger.LogInformation($"Found user: {user.Id} ({user.Name}) with current role: {user.Role}");
                
                if (user.Role != "Membership")
                {
                    var oldRole = user.Role;
                    user.Role = "Membership";
                    
                    // Calculate membership expiry date based on plan
                    var expiryDate = plan switch
                    {
                        "pro_month" => DateTime.Now.AddMonths(1),
                        "pro_quarter" => DateTime.Now.AddMonths(3),
                        "pro_year" => DateTime.Now.AddYears(1),
                        _ => DateTime.Now.AddMonths(1) // Default to 1 month
                    };
                    
                    // Add a MembershipExpiryDate field to User model if needed
                    // user.MembershipExpiryDate = expiryDate;
                    
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Successfully upgraded user {user.Id} ({user.Name}) from {oldRole} to Membership with plan: {plan}, expires: {expiryDate}");
                    return true;
                }
                else
                {
                    _logger.LogInformation($"User {user.Id} ({user.Name}) is already a Membership user");
                    return true; // Consider it successful if already membership
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error upgrading user {userId} to Membership: {ex.Message}");
                return false;
            }
        }

        private async Task<(bool success, int? agentProfileId)> CommitAgentProfile(string previewId)
        {
            try
            {
                _logger.LogInformation($"Attempting to commit agent profile with previewId: {previewId}");

                // Get the preview data from cache
                if (!_cache.TryGetValue(previewId, out CreateAgentProfileDTO dtoToCommit))
                {
                    _logger.LogWarning($"Preview data not found in cache for previewId: {previewId}");
                    return (false, null);
                }

                _logger.LogInformation($"Found preview data in cache for previewId: {previewId}");
                _logger.LogInformation($"Preview data - UserId: {dtoToCommit.UserId}, ShopName: {dtoToCommit.ShopName}");

                // Move files from temp to permanent location
                dtoToCommit.AvatarUrl = MoveFileToPermanentLocation(dtoToCommit.AvatarUrl, "avatars");
                dtoToCommit.BannerUrl = MoveFileToPermanentLocation(dtoToCommit.BannerUrl, "banners");

                _logger.LogInformation($"Files moved - Avatar: {dtoToCommit.AvatarUrl}, Banner: {dtoToCommit.BannerUrl}");

                // Create the agent profile using the service
                var result = await _agentProfileService.CreateAsync(dtoToCommit);
                if (result != null)
                {
                    _logger.LogInformation($"Agent profile created successfully with ID: {result.Id}");

                    // Remove the preview data from cache
                    _cache.Remove(previewId);
                    _logger.LogInformation($"Preview data removed from cache for previewId: {previewId}");

                    return (true, result.Id);
                }
                else
                {
                    _logger.LogError($"Failed to create agent profile for previewId: {previewId}");
                    return (false, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error committing agent profile with previewId {previewId}: {ex.Message}");
                return (false, null);
            }
        }

        private string? MoveFileToPermanentLocation(string? temporaryRelativePath, string targetFolder)
        {
            if (string.IsNullOrEmpty(temporaryRelativePath))
            {
                return null;
            }

            try
            {
                // temporaryRelativePath sẽ có dạng "/uploads/temp/avatars/filename.jpg"
                var fileName = Path.GetFileName(temporaryRelativePath);

                // Xây dựng đường dẫn vật lý đầy đủ của file tạm thời
                var tempFilePath = Path.Combine(_webHostEnvironment.WebRootPath, temporaryRelativePath.TrimStart('/'));

                // Xây dựng đường dẫn vật lý đầy đủ của thư mục đích
                var permanentFolderPath = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", targetFolder);

                // Tạo thư mục đích nếu nó chưa tồn tại
                if (!Directory.Exists(permanentFolderPath))
                {
                    Directory.CreateDirectory(permanentFolderPath);
                }

                // Xây dựng đường dẫn vật lý đầy đủ của file đích
                var permanentFilePath = Path.Combine(permanentFolderPath, fileName);

                // Kiểm tra xem file tạm có tồn tại không trước khi di chuyển
                if (System.IO.File.Exists(tempFilePath))
                {
                    // Di chuyển file
                    System.IO.File.Move(tempFilePath, permanentFilePath, true); // true để ghi đè nếu file đã tồn tại

                    // Trả về đường dẫn tương đối mới cho file
                    return $"/uploads/{targetFolder}/{fileName}";
                }
                else
                {
                    _logger.LogWarning($"Temporary file not found: {tempFilePath}");
                    return temporaryRelativePath; // Giữ lại đường dẫn tạm thời nếu không tìm thấy file
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error moving file from {temporaryRelativePath} to {targetFolder}: {ex.Message}");
                return temporaryRelativePath; // Giữ lại đường dẫn cũ nếu có lỗi
            }
        }

        private async Task CreatePaymentNotifications(int userId, string? plan, string? previewId, int? agentProfileId)
        {
            try
            {
                _logger.LogInformation($"Creating payment notifications for user {userId}, plan: {plan}, previewId: {previewId}, agentProfileId: {agentProfileId}");
                
                // Get user info for notification
                var user = await _context.Users.FindAsync(userId);
                if (user == null) 
                {
                    _logger.LogWarning($"User {userId} not found, cannot create notifications");
                    return;
                }
                
                _logger.LogInformation($"Found user: {user.Id} ({user.Name})");

                var notifications = new List<Notification>();

                // Always create a payment success notification
                notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "Thanh toán thành công! 🎉",
                    Message = $"Giao dịch của bạn đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
                    Type = "payment_success",
                    IsRead = false,
                    CreatedAt = DateTime.Now
                });
                
                _logger.LogInformation($"Added payment_success notification for user {userId}");

                // Create membership upgrade notification if applicable
                if (string.IsNullOrEmpty(previewId))
                {
                    _logger.LogInformation($"Creating membership upgrade notification for user {userId} with plan {plan}");
                    var planName = GetPlanDisplayName(plan);
                    notifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = "Nâng cấp Membership thành công! 👑",
                        Message = $"Tài khoản của bạn đã được nâng cấp lên {planName}. Bạn có thể đăng bài không giới hạn và được ưu tiên hiển thị trong tìm kiếm!",
                        Type = "membership_upgrade",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    });
                    _logger.LogInformation($"Added membership_upgrade notification for user {userId}");
                }
                else
                {
                    _logger.LogInformation($"Skipping membership notification for user {userId} because previewId exists: {previewId}");
                }

                // Create agent profile notification if applicable
                if (!string.IsNullOrEmpty(previewId) && agentProfileId.HasValue)
                {
                    _logger.LogInformation($"Creating agent profile notification for user {userId}");
                    notifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = "Tạo chuyên trang môi giới thành công! 🏠",
                        Message = $"Chuyên trang môi giới của bạn đã được tạo thành công. Bạn có thể bắt đầu nhận khách hàng tiềm năng ngay bây giờ!",
                        Type = "agent_profile_created",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    });
                    _logger.LogInformation($"Added agent_profile_created notification for user {userId}");
                }
                else
                {
                    _logger.LogInformation($"Skipping agent profile notification for user {userId} because previewId: {previewId}, agentProfileId: {agentProfileId}");
                }

                // Add all notifications to database
                _context.Notifications.AddRange(notifications);
                var saveResult = await _context.SaveChangesAsync();
                _logger.LogInformation($"Saved {saveResult} notifications to database for user {userId}");

                _logger.LogInformation($"Created {notifications.Count} notifications for user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating payment notifications for user {userId}: {ex.Message}");
            }
        }

        private string GetPlanDisplayName(string? plan)
        {
            return plan switch
            {
                "pro_month" => "Pro 1 Tháng",
                "pro_quarter" => "Pro 3 Tháng", 
                "pro_year" => "Pro 12 Tháng",
                "basic" => "Gói Cơ Bản",
                "premium" => "Gói Cao Cấp",
                _ => "Membership"
            };
        }
    }
}
