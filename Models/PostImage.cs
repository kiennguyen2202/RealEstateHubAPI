using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateHubAPI.Model
{
    public class PostImage
    {
        [Key]
        public int Id { get; set; }
        public int PostId { get; set; }
        public string Url { get; set; }
        
        public virtual Post? Post { get; set; }

    }
}
