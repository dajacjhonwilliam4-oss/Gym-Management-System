using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GymManagementAPI.Models;

public class Member
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

    [BsonElement("membershipType")]
    public string MembershipType { get; set; } = string.Empty;

    [BsonElement("joinDate")]
    public DateTime JoinDate { get; set; } = DateTime.UtcNow;

    [BsonElement("status")]
    public string Status { get; set; } = "active";

    [BsonElement("address")]
    public string? Address { get; set; }

    [BsonElement("emergencyContact")]
    public string? EmergencyContact { get; set; }

    [BsonElement("expirationDate")]
    [BsonIgnoreIfNull]
    public DateTime? ExpirationDate { get; set; }

    [BsonElement("isTrial")]
    public bool IsTrial { get; set; } = false;

    [BsonElement("coachId")]
    [BsonIgnoreIfNull]
    public string? CoachId { get; set; }

    [BsonElement("coachName")]
    [BsonIgnoreIfNull]
    public string? CoachName { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Mongoose version field - ignore this
    [BsonElement("__v")]
    [BsonIgnoreIfNull]
    public int? Version { get; set; }
}
