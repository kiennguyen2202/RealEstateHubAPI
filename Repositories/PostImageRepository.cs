using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;

public class PostImageRepository : IPostImageRepository
{
    private readonly ApplicationDbContext _context;

    public PostImageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PostImage>> GetPostImagesAsync()
    {
        return await _context.PostImages.Include(pi => pi.Post).ToListAsync();
    }

    public async Task<PostImage?> GetPostImageByIdAsync(int id)
    {
        return await _context.PostImages.Include(pi => pi.Post)
                                        .FirstOrDefaultAsync(pi => pi.Id == id);
    }

    public async Task AddPostImageAsync(PostImage postImage)
    {
        _context.PostImages.Add(postImage);
        await _context.SaveChangesAsync();
    }

    public async Task UpdatePostImageAsync(PostImage postImage)
    {
        _context.PostImages.Update(postImage);
        await _context.SaveChangesAsync();
    }

    public async Task DeletePostImageAsync(int id)
    {
        var entity = await _context.PostImages.FindAsync(id);
        if (entity != null)
        {
            _context.PostImages.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}


