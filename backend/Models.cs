using System.Text.Json;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public record Skill(string Name, string Level);

// Align Experience with request payload shape
public record Experience(
    string CompanyName,
    string Tag,
    string BeginDate,
    string EndDate,
    string WorkDescription
);

// Align Project with request payload shape
public record Project(
    string ProjectName,
    string ProjectTechnologies,
    string ProductDescription,
    string? ProjectLink = null
);

[BsonIgnoreExtraElements]
public record Post(string Title, string Date, string Summary, string Slug)
{
    [BsonId]
    public ObjectId Id { get; set; }
    public List<string>? Tags { get; set; }
    public string? Body { get; set; }
    public bool Published { get; set; } = true;
}

public record PostCreate(
    string Title,
    string Date,
    string Summary,
    string Slug,
    List<string>? Tags,
    string? Body,
    bool? Published
);

// Partial update payload without Id (use when Id is in route)
public record PostUpdate(
    string? Title,
    string? Date,
    string? Summary,
    string? Slug,
    List<string>? Tags,
    string? Body,
    bool? Published
);

// Partial update payload with Id (use when sending Id in body)
public record PostUpdateWithId(
    string Id,
    string? Title,
    string? Date,
    string? Summary,
    string? Slug,
    List<string>? Tags,
    string? Body,
    bool? Published
);

[BsonIgnoreExtraElements]
public class HomeData
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public string? HeroEmblem { get; set; }
    public Dictionary<string, List<Skill>> Skills { get; set; } = new();
    public List<Experience> Experiences { get; set; } = new();
    public List<Project> Projects { get; set; } = new();
    public List<Post> Posts { get; set; } = new();
    public bool HasCv { get; set; }
    public List<OngoingProject> OngoingProjects { get; set; } = new();
}

public record OngoingProject(string Name, int Percent);

// Admin: upsert payload for HomeData
public class HomeUpsertRequest
{
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public string? HeroEmblem { get; set; }
    public Dictionary<string, List<Skill>>? Skills { get; set; }
    public List<Experience>? Experiences { get; set; }
    public List<Project>? Projects { get; set; }
    public List<Post>? Posts { get; set; }
    public bool? HasCv { get; set; }
    public List<OngoingProject>? OngoingProjects { get; set; }
}

public class InsertRequest
{
    public string Collection { get; set; } = string.Empty;
    public JsonElement Document { get; set; }
}

public record LoginRequest(string Username, string Password);

// Simple tracking docs
public class Visitor
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string Ip { get; set; } = string.Empty;
    public DateTime FirstSeen { get; set; }
    public DateTime? LastSeen { get; set; }
}

public class CvDownload
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string Ip { get; set; } = string.Empty;
    public DateTime FirstDownloaded { get; set; }
    public DateTime? LastDownloaded { get; set; }
}

// Contact messages
public record ContactRequest(
    string Name,
    string Email,
    string Message,
    string? Hp = null,
    long? Ts = null
);

public class ContactMessage
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
}
