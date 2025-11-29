using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GymManagementAPI.Models;

public class Schedule
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("className")]
    public string ClassName { get; set; } = string.Empty;

    [BsonElement("coachId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CoachId { get; set; } = string.Empty;

    [BsonElement("day")]
    [BsonIgnoreIfNull]
    public string? Day { get; set; }

    [BsonElement("date")]
    public string Date { get; set; } = string.Empty;

    [BsonElement("startTime")]
    public string StartTime { get; set; } = string.Empty;

    [BsonElement("endTime")]
    public string EndTime { get; set; } = string.Empty;

    [BsonElement("capacity")]
    public int? Capacity { get; set; }

    [BsonElement("description")]
    [BsonIgnoreIfNull]
    public string? Description { get; set; }

    [BsonElement("enrolledMembers")]
    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> EnrolledMembers { get; set; } = new();

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
    public Coach? Coach { get; set; }
}
