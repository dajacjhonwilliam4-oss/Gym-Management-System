using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GymManagementAPI.Models;

public class Coach
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("password")]
    public string? Password { get; set; }

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("specialization")]
    public string Specialization { get; set; } = string.Empty;

    [BsonElement("experience")]
    public int? Experience { get; set; }

    [BsonElement("image")]
    [BsonIgnoreIfNull]
    public string? Image { get; set; }

    [BsonElement("certifications")]
    [BsonIgnoreIfNull]
    [BsonIgnoreIfDefault]
    public object? Certifications { get; set; }

    [BsonElement("bio")]
    [BsonIgnoreIfNull]
    public string? Bio { get; set; }

    [BsonElement("teachingPreferences")]
    [BsonIgnoreIfNull]
    [BsonIgnoreIfDefault]
    public object? TeachingPreferences { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "active";

    [BsonElement("salary")]
    public decimal? Salary { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Mongoose version field - ignore this
    [BsonElement("__v")]
    [BsonIgnoreIfNull]
    public int? Version { get; set; }
}
