using GymManagementAPI.Models;
using MongoDB.Driver;

namespace GymManagementAPI;

/// <summary>
/// Console tool to create admin users directly in the database
/// Run this as a separate console application or add it to Program.cs
/// </summary>
public class CreateAdminTool
{
    public static async Task CreateAdmin()
    {
        Console.WriteLine("╔════════════════════════════════════════╗");
        Console.WriteLine("║     Admin Account Creation Tool       ║");
        Console.WriteLine("╚════════════════════════════════════════╝\n");

        var connectionString = "mongodb+srv://UserFor_All:CYcLOapsCYGu68Q7@gymmanagement.gzqjhpb.mongodb.net/gym_management?retryWrites=true&w=majority";
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase("gym_management");
        var usersCollection = database.GetCollection<User>("users");

        Console.Write("Enter admin name: ");
        var name = Console.ReadLine()?.Trim() ?? "";

        Console.Write("Enter admin email: ");
        var email = Console.ReadLine()?.Trim() ?? "";

        Console.Write("Enter admin password (min 6 characters): ");
        var password = Console.ReadLine()?.Trim() ?? "";

        if (password.Length < 6)
        {
            Console.WriteLine("❌ Password must be at least 6 characters long");
            return;
        }

        // Check if user already exists
        var existingUser = await usersCollection.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (existingUser != null)
        {
            Console.WriteLine("❌ User with this email already exists!");
            Console.Write("Do you want to promote this user to admin? (yes/no): ");
            var promote = Console.ReadLine()?.ToLower();

            if (promote == "yes" || promote == "y")
            {
                var update = Builders<User>.Update
                    .Set(u => u.Role, "admin")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);

                await usersCollection.UpdateOneAsync(u => u.Id == existingUser.Id, update);
                Console.WriteLine("\n✅ User promoted to admin!");
            }

            return;
        }

        // Hash password
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(10));

        // Create new admin
        var admin = new User
        {
            Name = name,
            Email = email,
            Password = hashedPassword,
            Role = "admin",
            AuthProvider = "local",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await usersCollection.InsertOneAsync(admin);

        Console.WriteLine("\n✅ Admin created successfully!");
        Console.WriteLine($"Name: {admin.Name}");
        Console.WriteLine($"Email: {admin.Email}");
        Console.WriteLine($"Role: {admin.Role}");
        Console.WriteLine("\n⚠️  Keep these credentials safe!");
    }
}
