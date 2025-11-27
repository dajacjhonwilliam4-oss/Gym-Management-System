using GymManagementAPI.Models;
using MongoDB.Driver;

namespace GymManagementAPI.Services;

public class CoachService : ICoachService
{
    private readonly IMongoCollection<Coach> _coaches;
    private readonly IMongoCollection<User> _users;
    private readonly IAuthService _authService;

    public CoachService(IMongoDatabase database, IAuthService authService)
    {
        _coaches = database.GetCollection<Coach>("coaches");
        _users = database.GetCollection<User>("users");
        _authService = authService;
    }

    public async Task<List<Coach>> GetAllAsync()
    {
        return await _coaches.Find(_ => true).ToListAsync();
    }

    public async Task<Coach?> GetByIdAsync(string id)
    {
        return await _coaches.Find(c => c.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Coach> CreateAsync(Coach coach)
    {
        coach.CreatedAt = DateTime.UtcNow;
        coach.UpdatedAt = DateTime.UtcNow;
        
        // Store the password temporarily before inserting
        var plainPassword = coach.Password;
        
        // Don't store password in coach document
        coach.Password = null;
        await _coaches.InsertOneAsync(coach);

        // Create user account for coach if password provided
        if (!string.IsNullOrEmpty(plainPassword))
        {
            var user = new User
            {
                Name = coach.Name,
                Email = coach.Email,
                Password = _authService.HashPassword(plainPassword),
                Role = "coach",
                AuthProvider = "local",
                IsActive = true
            };
            await _users.InsertOneAsync(user);
        }

        return coach;
    }

    public async Task<Coach?> UpdateAsync(string id, Coach coach)
    {
        coach.UpdatedAt = DateTime.UtcNow;
        coach.Id = id;
        
        // Store the password temporarily if provided
        var plainPassword = coach.Password;
        
        // Don't store password in coach document
        coach.Password = null;
        
        await _coaches.ReplaceOneAsync(c => c.Id == id, coach);
        
        // Update user password if provided
        if (!string.IsNullOrEmpty(plainPassword))
        {
            var user = await _users.Find(u => u.Email == coach.Email).FirstOrDefaultAsync();
            if (user != null)
            {
                user.Password = _authService.HashPassword(plainPassword);
                await _users.ReplaceOneAsync(u => u.Id == user.Id, user);
            }
        }
        
        return coach;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _coaches.DeleteOneAsync(c => c.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<long> DeleteAllAsync()
    {
        var result = await _coaches.DeleteManyAsync(_ => true);
        return result.DeletedCount;
    }
}
