using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Threading.Tasks;
using System;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.DTOs;
using Microsoft.Extensions.Options;
using RealEstateHubAPI.Services;
using RealEstateHubAPI.Libraries;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;


namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        private readonly IVNPayService _vnPayService;
        private readonly IPaymentProcessingService _paymentProcessingService;
        private readonly IMomoService _momoService;


        public PaymentController(
            IWebHostEnvironment env, 
            ApplicationDbContext context, 
            IVNPayService vnPayService,
            IPaymentProcessingService paymentProcessingService,
            IMomoService momoService)
        {
            _env = env;
            _context = context;
            _vnPayService = vnPayService;
            _paymentProcessingService = paymentProcessingService;
            _momoService = momoService;
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> Confirm([FromForm] PaymentConfirmationDto dto)
        {
            string receiptUrl = null;
            if (dto.Receipt != null && dto.Receipt.Length > 0)
            {
                var uploads = Path.Combine(_env.WebRootPath, "uploads", "receipts");
                if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Receipt.FileName)}";
                var filePath = Path.Combine(uploads, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Receipt.CopyToAsync(stream);
                }
                receiptUrl = $"/uploads/receipts/{fileName}";
            }

            var model = new PaymentConfirmation
            {
                UserId = dto.UserId,
                Name = dto.Name, 
                Phone = dto.Phone,
                Email = dto.Email,
                PaymentMethod = dto.PaymentMethod,
                ReceiptUrl = receiptUrl,
                CreatedAt = DateTime.Now
            };

            _context.PaymentConfirmations.Add(model);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("vnpay/create")]
        public IActionResult CreatePaymentUrlVnpay([FromBody] PaymentInformationModel model)
        {
            var url = _vnPayService.CreatePaymentUrl(model, HttpContext);
            return Ok(new { url });
        }

        [HttpPost("momo/create")]
        public async Task<IActionResult> CreatePaymentUrlMomo([FromBody] PaymentInformationModel model)
        {
            try
            {
                var orderInfo = new OrderInfo
                {
                    FullName = model.Name,
                    OrderInfomation = model.OrderDescription,
                    Amount = (long)model.Amount
                };

                var response = await _momoService.CreatePaymentAsync(orderInfo);
                
                if (response.ErrorCode == 0 && !string.IsNullOrEmpty(response.PayUrl))
                {
                    return Ok(new { url = response.PayUrl });
                }
                else
                {
                    return BadRequest(new { error = response.Message });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Lỗi khi tạo thanh toán MoMo: " + ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> PaymentCallbackVnpay()
        {
    
            var response = _vnPayService.PaymentExecute(Request.Query);
 
            // Auto upgrade user role if payment successful
            if (response.Success && response.OrderInfo != null)
            {
                
                try
                {
                    var (processingSuccess, agentProfileId) = await _paymentProcessingService.ProcessSuccessfulPayment(response.OrderInfo);
                    if (processingSuccess)
                    {
                        
                        if (agentProfileId.HasValue)
                        {
                            
                            // Add agent profile ID to the response
                            response.AgentProfileId = agentProfileId.Value;
                        }
                    }
                    else
                    {
                        Console.WriteLine("Payment processing failed");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in payment processing: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"Payment not successful or OrderInfo is null. Success: {response.Success}, OrderInfo: {response.OrderInfo}");
            }
            
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpGet("momo-return")]
        public async Task<IActionResult> PaymentCallbackMomo()
        {
            
            
            var response = _momoService.PaymentExecuteAsync(Request.Query);
            
            
            
            // Auto upgrade user role if payment successful
            if (response.Success && !string.IsNullOrEmpty(response.OrderInfo))
            {
                
                try
                {
                    var (processingSuccess, agentProfileId) = await _paymentProcessingService.ProcessSuccessfulPayment(response.OrderInfo);
                    if (processingSuccess)
                    {
                        Console.WriteLine("MoMo payment processing completed successfully");
                        if (agentProfileId.HasValue)
                        {
                            Console.WriteLine($"Agent profile created with ID: {agentProfileId.Value}");
                            // Add agent profile ID to the response
                            response.AgentProfileId = agentProfileId.Value;
                        }
                    }
                    else
                    {
                        Console.WriteLine("MoMo payment processing failed");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in MoMo payment processing: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"MoMo payment not successful. Success: {response.Success}, OrderInfo: {response.OrderInfo}");
            }
            
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("vnpay-ipn")]
        public async Task<IActionResult> PaymentIPN()
        {
            
            
            var response = _vnPayService.PaymentExecute(Request.Query);
            
            // Process IPN callback for more reliable payment confirmation
            if (response.Success && response.OrderInfo != null)
            {
                Console.WriteLine($"Processing IPN with OrderInfo: {response.OrderInfo}");
                try
                {
                    var (processingSuccess, agentProfileId) = await _paymentProcessingService.ProcessSuccessfulPayment(response.OrderInfo);
                    if (processingSuccess)
                    {
                        Console.WriteLine("IPN payment processing completed successfully");
                        if (agentProfileId.HasValue)
                        {
                            Console.WriteLine($"Agent profile created with ID: {agentProfileId.Value}");
                        }
                    }
                    else
                    {
                        Console.WriteLine("IPN payment processing failed");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in IPN payment processing: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"IPN not successful or OrderInfo is null. Success: {response.Success}, OrderInfo: {response.OrderInfo}");
            }
            
            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        [AllowAnonymous]
        [HttpPost("momo-notify")]
        public async Task<IActionResult> MomoNotify()
        {
            Console.WriteLine($"MoMo Notify Callback - Query string: {Request.QueryString}");
            
            var response = _momoService.PaymentExecuteAsync(Request.Query);
            
            // Process notify callback for more reliable payment confirmation
            if (response.Success && !string.IsNullOrEmpty(response.OrderInfo))
            {
                Console.WriteLine($"Processing MoMo notify with OrderInfo: {response.OrderInfo}");
                try
                {
                    var (processingSuccess, agentProfileId) = await _paymentProcessingService.ProcessSuccessfulPayment(response.OrderInfo);
                    if (processingSuccess)
                    {
                        Console.WriteLine("MoMo notify payment processing completed successfully");
                        if (agentProfileId.HasValue)
                        {
                            Console.WriteLine($"Agent profile created with ID: {agentProfileId.Value}");
                        }
                    }
                    else
                    {
                        Console.WriteLine("MoMo notify payment processing failed");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in MoMo notify payment processing: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"MoMo notify not successful. Success: {response.Success}, OrderInfo: {response.OrderInfo}");
            }
            
            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        [HttpPost("test-process")]
        public async Task<IActionResult> TestProcessPayment([FromBody] string orderInfo)
        {
            try
            {
                Console.WriteLine($"Testing payment processing with orderInfo: {orderInfo}");
                var (success, agentProfileId) = await _paymentProcessingService.ProcessSuccessfulPayment(orderInfo);
                if (success)
                {
                    var response = new { 
                        success = true, 
                        message = "Payment processing test completed",
                        agentProfileId = agentProfileId
                    };
                    return Ok(response);
                }
                else
                {
                    return StatusCode(500, new { success = false, error = "Payment processing failed" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test payment processing error: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("test-upgrade")]
        public async Task<IActionResult> TestUpgradeUser([FromBody] int userId)
        {
            try
            {
                Console.WriteLine($"Testing user upgrade for userId: {userId}");
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, error = "User not found" });
                }

                var oldRole = user.Role;
                user.Role = "Membership";
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = $"User upgraded from {oldRole} to Membership",
                    user = new { id = user.Id, name = user.Name, role = user.Role }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test user upgrade error: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
        [HttpPost]
        [Route("CreatePaymentUrl")]

        public async Task<IActionResult> CreatePaymentUrl(OrderInfo model)
        {
            var response = await _momoService.CreatePaymentAsync(model);
            return Redirect(response.PayUrl);
        }

        [HttpPost("test-momo")]
        public async Task<IActionResult> TestMoMoPayment()
        {
            try
            {
                var orderInfo = new OrderInfo
                {
                    FullName = "Test User",
                    OrderInfomation = "userId=1;plan=pro_month;type=membership 199000",
                    Amount = 199000
                };

                var response = await _momoService.CreatePaymentAsync(orderInfo);
                
                Console.WriteLine($"MoMo test response - ErrorCode: {response.ErrorCode}, Message: {response.Message}, PayUrl: {response.PayUrl}");
                
                return Ok(new { 
                    success = response.ErrorCode == 0,
                    errorCode = response.ErrorCode,
                    message = response.Message,
                    payUrl = response.PayUrl,
                    fullResponse = response
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Lỗi khi test MoMo: " + ex.Message });
            }
        }

    }


}