using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public record Skill(string Name, string Level);
public record Experience(string Company, string Role, string Period, List<string> Achievements);
public record Project(string Title, string Summary, List<string> Tags, string Href);
public record Post(string Title, string Date, string Summary, string Slug);

public class HomeData
{
    [BsonId]
    public ObjectId Id { get; set; }
    public List<string> Highlights { get; set; } = new();
    public Dictionary<string, List<Skill>> Skills { get; set; } = new();
    public List<Experience> Experiences { get; set; } = new();
    public List<Project> Projects { get; set; } = new();
    public List<Post> Posts { get; set; } = new();
    public bool HasCv { get; set; }
}
