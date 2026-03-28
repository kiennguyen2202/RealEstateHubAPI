using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using RealEstateHubAPI.DTOs;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Repositories;
using RealEstateHubAPI.Services;
using System;
using System.Linq;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// Fix PostgreSQL DateTime issue (Cannot write DateTime with Kind=Local to timestamp with time zone)
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add repositories & services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IAreaRepository, AreaRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IAgentProfileRepository, AgentProfileRepository>();
builder.Services.AddScoped<IAgentProfileService, AgentProfileService>();

//Add VnPay service
builder.Services.AddScoped<IVNPayService, VNPayService>();
builder.Services.AddScoped<IPaymentProcessingService, PaymentProcessingService>();

//Add Momo service
builder.Services.Configure<MomoOptionModel>(builder.Configuration.GetSection("MomoAPI"));
builder.Services.AddScoped<IMomoService, MomoService>();

//Add PayOS service
builder.Services.Configure<PayOSSettings>(builder.Configuration.GetSection("PayOS"));
builder.Services.AddHttpClient<IPayOSService, PayOSService>();

//Add Chat service
builder.Services.AddScoped<IChatService, ChatService>();


//builder.Services.AddScoped<IReportRepository, ReportRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });


builder.Services.AddAuthorization();

// Add Controllers with increased file size limit for panorama images
builder.Services.AddControllers();

// Configure form options for large file uploads (panorama images can be 10-20MB each)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 524288000; // 500 MB total
    options.ValueLengthLimit = 524288000;
    options.MultipartHeadersLengthLimit = 524288000;
});

// Configure Kestrel server limits
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 524288000; // 500 MB
    serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
});

builder.Services.AddHttpClient();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddMemoryCache();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Real Estate Hub API",
        Version = "v1"
    });


    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,

    });


    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// AI text generation service
builder.Services.AddHttpClient(nameof(OpenAiTextService), client =>
{
    client.Timeout = TimeSpan.FromSeconds(120); // Increase timeout for AI
});
builder.Services.AddScoped<IAiTextService, OpenAiTextService>();

// OpenStreetMap amenity service - optimized with shorter timeout
builder.Services.AddHttpClient(nameof(OpenStreetMapAmenityService), client =>
{
    client.Timeout = TimeSpan.FromSeconds(15); // Reduce timeout to avoid blocking
});
builder.Services.AddScoped<IAmenityLookupService, OpenStreetMapAmenityService>();


// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.SetIsOriginAllowed(origin => true) // Allow any deployed domain
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddHostedService<ExpireNotificationService>();


var app = builder.Build();





// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();



// Configure static files with CORS support
var staticFileOptions = new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var origin = ctx.Context.Request.Headers["Origin"].FirstOrDefault() ?? "*";
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", origin);
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
    }
};

app.UseStaticFiles(staticFileOptions);

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>("/notificationHub");

app.Run();
