using GymManagementAPI.Models;

namespace GymManagementAPI.Services;

public interface IPaymentService
{
    Task<List<Payment>> GetAllAsync();
    Task<Payment?> GetByIdAsync(string id);
    Task<Payment> CreateAsync(Payment payment);
    Task<decimal> GetTotalRevenueAsync();
    Task<bool> DeleteAsync(string id);
}
