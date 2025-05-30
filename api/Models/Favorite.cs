using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Models
{
    public class Favorite
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PostId { get; set; }
        public DateTime CreatedFavorite { get; set; } = DateTime.Now;

        public User? User { get; set; }
        public Post? Post { get; set; }
    }
<<<<<<< HEAD:Models/Favorite.cs
}
=======
}
>>>>>>> f0e74249e6343aa16a7ba6b01cedfb82d8a91391:api/Models/Favorite.cs
