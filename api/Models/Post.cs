using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RealEstateHubAPI.Models;

namespace RealEstateHubAPI.Model
{
    public class Post
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        
        public PriceUnit PriceUnit { get; set; }
        public TransactionType TransactionType { get; set; }
        public string Status { get; set; }
        public DateTime Created { get; set; } = DateTime.Now;
        public float Area_Size { get; set; }
        public string Street_Name { get; set; }
        public string? ImageURL { get; set; } 
        public int UserId { get; set; }
        public int CategoryId { get; set; }
        public int AreaId { get; set; }
       

        public virtual User? User { get; set; }
        public virtual Category? Category { get; set; }
        public virtual Area? Area { get; set; }

        public List<PostImage>? Images { get; set; }

        

    }
}
