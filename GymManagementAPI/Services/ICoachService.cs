using GymManagementAPI.Models;

namespace GymManagementAPI.Services;

public interface ICoachService
{
    Task<List<Coach>> GetAllAsync();
    Task<Coach?> GetByIdAsync(string id);
    Task<Coach> CreateAsync(Coach coach);
    Task<Coach?> UpdateAsync(string id, Coach coach);
    Task<bool> DeleteAsync(string id);
    Task<long> DeleteAllAsync();
}
