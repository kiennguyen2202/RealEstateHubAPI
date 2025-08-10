using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Model
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        { }

        public DbSet<Area> Areas { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Ward> Wards { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostImage> PostImages { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<PaymentConfirmation> PaymentConfirmations { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AgentProfile> AgentProfiles { get; set; }
        public DbSet<AgentProfileArea> AgentProfileAreas { get; set; }
        public DbSet<AgentProfileCategory> AgentProfileCategories { get; set; }
        public DbSet<AgentProfileTransactionType> AgentProfileTransactionTypes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AgentProfileArea>()
                .HasKey(apa => new { apa.AgentProfileId, apa.AreaId });

            modelBuilder.Entity<AgentProfileArea>()
                .HasOne(apa => apa.AgentProfile)
                .WithMany(ap => ap.AgentProfileAreas)
                .HasForeignKey(apa => apa.AgentProfileId);

            modelBuilder.Entity<AgentProfileArea>()
                .HasOne(apa => apa.Area)
                .WithMany()
                .HasForeignKey(apa => apa.AreaId);

            modelBuilder.Entity<AgentProfileCategory>()
                .HasKey(apc => new { apc.AgentProfileId, apc.CategoryId });

            modelBuilder.Entity<AgentProfileCategory>()
                .HasOne(apc => apc.AgentProfile)
                .WithMany(ap => ap.AgentProfileCategories)
                .HasForeignKey(apc => apc.AgentProfileId);

            modelBuilder.Entity<AgentProfileCategory>()
                .HasOne(apc => apc.Category)
                .WithMany()
                .HasForeignKey(apc => apc.CategoryId);

            modelBuilder.Entity<AgentProfileTransactionType>()
                .HasKey(aptt => new { aptt.AgentProfileId, aptt.TransactionType });

            modelBuilder.Entity<AgentProfileTransactionType>()
                .HasOne(aptt => aptt.AgentProfile)
                .WithMany(ap => ap.AgentProfileTransactionTypes)
                .HasForeignKey(aptt => aptt.AgentProfileId);

            modelBuilder.Entity<PostImage>()
                .HasOne(pi => pi.Post)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.Category)
                .WithMany()
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.Area)
                .WithMany()
                .HasForeignKey(p => p.AreaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Post>()
                .Property(p => p.Id)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Report>()
                .Property(r => r.Type)
                .HasConversion<int>();

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}