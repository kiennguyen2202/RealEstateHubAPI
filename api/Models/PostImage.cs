using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RealEstateHubAPI.Model
{
    public class PostImage
    {
        [Key]
        public int Id { get; set; }
        public int PostId { get; set; }
        public string Url { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.Always)]
        public Post? Post { get; set; }

    }
}
