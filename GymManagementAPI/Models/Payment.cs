using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GymManagementAPI.Models;

public class Payment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("memberId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string MemberId { get; set; } = string.Empty;

    [BsonElement("memberName")]
    public string MemberName { get; set; } = string.Empty;

    [BsonElement("membershipType")]
    [BsonIgnoreIfNull]
    public string? MembershipType { get; set; }

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("paymentDate")]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [BsonElement("paymentMethod")]
    public string PaymentMethod { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "completed";

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("notes")]
    [BsonIgnoreIfNull]
    public string? Notes { get; set; }

    [BsonElement("isStudent")]
    public bool IsStudent { get; set; } = false;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Mongoose version field - ignore this
    [BsonElement("__v")]
    [BsonIgnoreIfNull]
    public int? Version { get; set; }

    // Populated field
    [BsonIgnore]
    public Member? Member { get; set; }
}
