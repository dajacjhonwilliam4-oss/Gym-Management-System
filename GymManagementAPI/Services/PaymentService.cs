using GymManagementAPI.Models;
using MongoDB.Driver;
using MongoDB.Bson;

namespace GymManagementAPI.Services;

public class PaymentService : IPaymentService
{
    private readonly IMongoCollection<Payment> _payments;
    private readonly IMongoCollection<Member> _members;

    public PaymentService(IMongoDatabase database)
    {
        _payments = database.GetCollection<Payment>("payments");
        _members = database.GetCollection<Member>("members");
    }

    public async Task<List<Payment>> GetAllAsync()
    {
        var payments = await _payments.Find(_ => true).ToListAsync();
        
        // Populate member information
        foreach (var payment in payments)
        {
            payment.Member = await _members.Find(m => m.Id == payment.MemberId).FirstOrDefaultAsync();
        }

        return payments;
    }

    public async Task<Payment?> GetByIdAsync(string id)
    {
        return await _payments.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Payment> CreateAsync(Payment payment)
    {
        payment.CreatedAt = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;
        await _payments.InsertOneAsync(payment);
        return payment;
    }

    public async Task<decimal> GetTotalRevenueAsync()
    {
        var payments = await _payments.Find(_ => true).ToListAsync();
        return payments.Sum(p => p.Amount);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _payments.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }
}
