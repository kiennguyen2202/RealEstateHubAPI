namespace RealEstateHubAPI.DTOs
{
    public class CreatePostDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Price { get; set; }
        public string Status { get; set; }
        public string Street_Name { get; set; }
        public float Area_Size { get; set; }

        public int CategoryId { get; set; }
        public int AreaId { get; set; }
        public int UserId { get; set; }

        public List<IFormFile> Images { get; set; }
    }
}
