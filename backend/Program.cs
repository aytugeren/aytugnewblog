using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);
var mongoConn = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING") ?? "mongodb://localhost:27017";
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME") ?? "aytugdb";
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConn));
builder.Services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDbName));

var app = builder.Build();

app.MapGet("/api/home", (IMongoDatabase db) =>
{
    var col = db.GetCollection<HomeData>("home");
    var data = col.Find(FilterDefinition<HomeData>.Empty).FirstOrDefault();
    return data is null ? Results.NotFound() : Results.Json(data);
});

app.MapPost("/api/home", (IMongoDatabase db, HomeData data) =>
{
    var col = db.GetCollection<HomeData>("home");
    col.InsertOne(data);
    return Results.Created($"/api/home/{data.Id}", data);
});

app.MapPut("/api/home", (IMongoDatabase db, HomeData data) =>
{
    var col = db.GetCollection<HomeData>("home");
    col.ReplaceOne(x => x.Id == data.Id, data);
    return Results.NoContent();
});

app.Run();
