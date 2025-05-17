using RealEstateHubAPI.Model;

namespace RealEstateHubAPI.Repositories
{
    public interface IPostImageRepository
    {
        Task<IEnumerable<PostImage>> GetPostImagesAsync();
        Task<PostImage> GetPostImageByIdAsync(int id);
        Task AddPostImageAsync(PostImage postImage);
        Task UpdatePostImageAsync(PostImage postImage);
        Task DeletePostImageAsync(int id);

    }
}
