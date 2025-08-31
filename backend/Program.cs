using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Net;

var builder = WebApplication.CreateBuilder(args);
// Use IPv4 loopback by default to avoid localhost -> ::1 resolution issues
var mongoConn = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING") ?? "mongodb://127.0.0.1:27017";
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME") ?? "aytugdb";
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConn));
builder.Services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDbName));

// Auth configuration
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "dev-secret-change-me-please-1234567890";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "aytug-blog";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "aytug-blog";
var keyBytes = Encoding.UTF8.GetBytes(jwtSecret);
var signingKey = new SymmetricSecurityKey(keyBytes);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        // Allow reading token from query or header for flexibility
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Authorization: Bearer <token> already handled by default
                if (string.IsNullOrEmpty(context.Token))
                {
                    var tokenFromQuery = context.Request.Query["access_token"].FirstOrDefault();
                    if (!string.IsNullOrWhiteSpace(tokenFromQuery))
                    {
                        context.Token = tokenFromQuery;
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// CORS: allow Next.js dev server on localhost:3000
const string CorsPolicy = "AllowLocal3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: CorsPolicy, policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
            // .AllowCredentials(); // enable if sending cookies/auth
    });
});

var app = builder.Build();

// Use CORS before mapping endpoints
app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/home", (IMongoDatabase db) =>
{
    var col = db.GetCollection<HomeData>("home");
    var data = col.Find(FilterDefinition<HomeData>.Empty).FirstOrDefault();
    return data is null ? Results.NotFound() : Results.Json(data);
});

app.MapPost("/api/home", (IMongoDatabase db, HomeData data) =>
{
    var col = db.GetCollection<HomeData>("home");
    if (data.Id == ObjectId.Empty)
    {
        data.Id = ObjectId.GenerateNewId();
    }
    col.InsertOne(data);
    return Results.Created($"/api/home/{data.Id}", data);
}).RequireAuthorization();

// Insert-or-Update (single document) endpoint for home data
app.MapPost("/api/home/upsert", (IMongoDatabase db, HomeData data) =>
{
    var col = db.GetCollection<HomeData>("home");
    var existing = col.Find(FilterDefinition<HomeData>.Empty).FirstOrDefault();

    if (existing is null)
    {
        if (data.Id == ObjectId.Empty)
        {
            data.Id = ObjectId.GenerateNewId();
        }
        col.InsertOne(data);
        return Results.Created($"/api/home/{data.Id}", data);
    }
    else
    {
        // Keep the existing Id and replace the document
        data.Id = existing.Id;
        col.ReplaceOne(x => x.Id == existing.Id, data);
        return Results.Ok(data);
    }
}).RequireAuthorization();

app.MapPut("/api/home", (IMongoDatabase db, HomeData data) =>
{
    var col = db.GetCollection<HomeData>("home");
    col.ReplaceOne(x => x.Id == data.Id, data);
    return Results.NoContent();
}).RequireAuthorization();

// Delete all home documents (since we keep at most one)
app.MapDelete("/api/home", (IMongoDatabase db) =>
{
    var col = db.GetCollection<HomeData>("home");
    var result = col.DeleteMany(FilterDefinition<HomeData>.Empty);
    return Results.Ok(new { deleted = result.DeletedCount });
}).RequireAuthorization();

// Upload CV file and store to a path FE serves (default: public/cv.pdf)
app.MapPost("/api/upload/cv", async ([FromServices] IMongoDatabase db, HttpRequest request) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest("multipart/form-data expected");
    }
    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file is null || file.Length == 0)
    {
        return Results.BadRequest("file is required");
    }

    var targetPath = Environment.GetEnvironmentVariable("CV_OUTPUT_PATH");
    if (string.IsNullOrWhiteSpace(targetPath))
    {
        // Default to monorepo public folder relative to app base dir
        var pub = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public"));
        Directory.CreateDirectory(pub);
        targetPath = Path.Combine(pub, "cv.pdf");
    }

    var dir = Path.GetDirectoryName(targetPath);
    if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

    await using (var fs = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None))
    {
        await file.CopyToAsync(fs);
    }

    // Ensure HomeData.HasCv = true
    var bcol = db.GetCollection<BsonDocument>("home");
    var update = Builders<BsonDocument>.Update.Set("HasCv", true);
    await bcol.UpdateOneAsync(FilterDefinition<BsonDocument>.Empty, update, new UpdateOptions { IsUpsert = true });

    return Results.Ok(new { saved = true, path = targetPath, hasCv = true });
}).RequireAuthorization();

// Upload blog images; returns public URL
app.MapPost("/api/upload/image", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest("multipart/form-data expected");
    }
    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file is null || file.Length == 0)
    {
        return Results.BadRequest("file is required");
    }
    // simple content-type guard
    if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest("only image files allowed");
    }

    var uploadsDirEnv = Environment.GetEnvironmentVariable("UPLOADS_DIR");
    string publicDir;
    if (!string.IsNullOrWhiteSpace(uploadsDirEnv))
    {
        publicDir = uploadsDirEnv;
    }
    else
    {
        publicDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/uploads"));
    }
    Directory.CreateDirectory(publicDir);

    var ext = Path.GetExtension(file.FileName);
    if (string.IsNullOrWhiteSpace(ext)) ext = ".bin";
    var safeExt = new string(ext.Where(ch => char.IsLetterOrDigit(ch) || ch == '.').ToArray());
    if (string.IsNullOrWhiteSpace(safeExt) || safeExt.Length > 8) safeExt = ".bin";
    var fname = $"{ObjectId.GenerateNewId()}{safeExt}";
    var savePath = Path.Combine(publicDir, fname);
    await using (var fs = new FileStream(savePath, FileMode.Create, FileAccess.Write, FileShare.None))
    {
        await file.CopyToAsync(fs);
    }
    // public URL path relative to Next public
    var urlPath = $"/uploads/{fname}";
    return Results.Ok(new { url = urlPath });
}).RequireAuthorization();

// Generic insert endpoint to write arbitrary data to any collection
app.MapPost("/api/insert", async ([FromServices] IMongoDatabase db, [FromBody] InsertRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Collection))
    {
        return Results.BadRequest("'collection' is required");
    }

    // Convert incoming JSON to BsonDocument
    BsonDocument doc;
    try
    {
        var json = req.Document.ValueKind == JsonValueKind.Undefined
            ? null
            : req.Document.GetRawText();
        if (string.IsNullOrWhiteSpace(json))
        {
            return Results.BadRequest("'document' is required");
        }
        doc = BsonDocument.Parse(json);
    }
    catch (Exception ex)
    {
        return Results.BadRequest($"invalid document: {ex.Message}");
    }

    if (!doc.Contains("_id"))
    {
        doc["_id"] = ObjectId.GenerateNewId();
    }

    var col = db.GetCollection<BsonDocument>(req.Collection);
    await col.InsertOneAsync(doc);

    var id = doc["_id"].IsObjectId ? doc["_id"].AsObjectId.ToString() : doc["_id"].ToString();

    // Convert BsonDocument to plain .NET types for System.Text.Json
    var plain = (Dictionary<string, object?>)BsonTypeMapper.MapToDotNetValue(doc);
    if (plain.TryGetValue("_id", out var idVal) && idVal is ObjectId oid)
    {
        plain["_id"] = oid.ToString();
    }

    return Results.Created($"/api/{req.Collection}/{id}", plain);
}).RequireAuthorization();

// Posts endpoints
app.MapGet("/api/posts", (IMongoDatabase db) =>
{
    var col = db.GetCollection<Post>("posts");
    var posts = col.Find(FilterDefinition<Post>.Empty).ToList();
    if (posts.Count == 0) return Results.NotFound();
    var result = posts.Select(p => new { id = p.Id.ToString(), p.Title, p.Date, p.Summary, p.Slug, p.Tags });
    return Results.Json(result);
});

app.MapGet("/api/posts/{slug}", (IMongoDatabase db, string slug) =>
{
    var col = db.GetCollection<Post>("posts");
    var post = col.Find(x => x.Slug == slug).FirstOrDefault();
    if (post is null) return Results.NotFound();
    var result = new { id = post.Id.ToString(), post.Title, post.Date, post.Summary, post.Slug, post.Tags, post.Body };
    return Results.Json(result);
});

// Create a post and optionally write an MDX file under content/posts
app.MapPost("/api/posts", async (IMongoDatabase db, PostCreate req) =>
{
    if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Slug) || string.IsNullOrWhiteSpace(req.Date))
    {
        return Results.BadRequest("title, slug and date are required");
    }

    var postsCol = db.GetCollection<Post>("posts");
    var existing = await postsCol.Find(x => x.Slug == req.Slug).FirstOrDefaultAsync();
    if (existing is not null)
    {
        return Results.Conflict("slug already exists");
    }

    var post = new Post(req.Title, req.Date, req.Summary, req.Slug)
    {
        Id = ObjectId.GenerateNewId(),
        Tags = req.Tags ?? new List<string>(),
        Body = req.Body,
        Published = req.Published ?? true,
    };

    await postsCol.InsertOneAsync(post);

    // Try to write an MDX file mirroring the post
    try
    {
        var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
            ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
        Directory.CreateDirectory(contentDir);

        var mdxPath = Path.Combine(contentDir, $"{req.Slug}.mdx");
        var sb = new StringBuilder();
        sb.AppendLine("---");
        sb.AppendLine($"title: \"{EscapeYaml(req.Title)}\"");
        sb.AppendLine($"date: \"{req.Date}\"");
        if (!string.IsNullOrWhiteSpace(req.Summary)) sb.AppendLine($"summary: \"{EscapeYaml(req.Summary)}\"");
        if (req.Tags is { Count: > 0 })
        {
            sb.AppendLine("tags:");
            foreach (var t in req.Tags)
            {
                sb.AppendLine($"  - {EscapeYaml(t)}");
            }
        }
        sb.AppendLine("---");
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(req.Body))
        {
            sb.AppendLine(req.Body);
        }
        else
        {
            sb.AppendLine($"# {req.Title}");
            if (!string.IsNullOrWhiteSpace(req.Summary))
                sb.AppendLine($"\n{req.Summary}\n");
        }

        await File.WriteAllTextAsync(mdxPath, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
    catch
    {
        // swallow file IO errors to not block API; can be logged if needed
    }

    return Results.Created($"/api/posts/{post.Slug}", new { id = post.Id.ToString(), post.Title, post.Date, post.Summary, post.Slug, post.Tags });
}).RequireAuthorization();

// Update a post by ObjectId in route, partial update supported
app.MapPut("/api/posts/{id}", async (IMongoDatabase db, string id, PostUpdate update) =>
{
    if (!ObjectId.TryParse(id, out var oid))
    {
        return Results.BadRequest("invalid id format");
    }

    var col = db.GetCollection<Post>("posts");
    var existing = await col.Find(p => p.Id == oid).FirstOrDefaultAsync();
    if (existing is null) return Results.NotFound();

    var oldSlug = existing.Slug;
    string? desiredSlug = null;
    var slugProvided = update.Slug is not null;
    if (slugProvided)
    {
        desiredSlug = update.Slug;
        // If client explicitly provided slug, keep old behavior: conflict if taken by another
        if (!string.IsNullOrWhiteSpace(desiredSlug))
        {
            var slugExists = await col.Find(x => x.Slug == desiredSlug && x.Id != oid).AnyAsync();
            if (slugExists)
            {
                return Results.Conflict("slug already exists");
            }
        }
    }
    else if (update.Title is not null)
    {
        desiredSlug = Slugify(update.Title);
        // Auto ensure uniqueness when auto-generating
        if (!string.Equals(desiredSlug, oldSlug, StringComparison.OrdinalIgnoreCase))
        {
            var baseSlug = desiredSlug;
            var i = 2;
            while (await col.Find(x => x.Slug == desiredSlug && x.Id != oid).AnyAsync())
            {
                desiredSlug = $"{baseSlug}-{i}";
                i++;
                if (i > 200) break; // safety
            }
        }
    }

    var updates = new List<UpdateDefinition<Post>>();
    var ub = Builders<Post>.Update;
    if (update.Title is not null) updates.Add(ub.Set(p => p.Title, update.Title));
    if (update.Date is not null) updates.Add(ub.Set(p => p.Date, update.Date));
    if (update.Summary is not null) updates.Add(ub.Set(p => p.Summary, update.Summary));
    if (desiredSlug is not null && !string.Equals(desiredSlug, oldSlug, StringComparison.Ordinal))
        updates.Add(ub.Set(p => p.Slug, desiredSlug));
    if (update.Tags is not null) updates.Add(ub.Set(p => p.Tags, update.Tags));
    if (update.Body is not null) updates.Add(ub.Set(p => p.Body, update.Body));
    if (update.Published is not null) updates.Add(ub.Set(p => p.Published, update.Published.Value));

    if (updates.Count == 0)
    {
        return Results.BadRequest("no fields to update");
    }

    var result = await col.UpdateOneAsync(p => p.Id == oid, ub.Combine(updates));
    if (result.MatchedCount == 0)
    {
        return Results.NotFound();
    }

    var updated = await col.Find(p => p.Id == oid).FirstOrDefaultAsync();
    if (updated is null) return Results.NotFound();

    // If slug changed, try to rename the MDX file (old slug "silinsin")
    if (!string.IsNullOrWhiteSpace(oldSlug) && !string.IsNullOrWhiteSpace(updated.Slug) && !string.Equals(oldSlug, updated.Slug, StringComparison.Ordinal))
    {
        try
        {
            var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
                ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
            var oldPath = Path.Combine(contentDir, $"{oldSlug}.mdx");
            var newPath = Path.Combine(contentDir, $"{updated.Slug}.mdx");
            if (File.Exists(oldPath))
            {
                Directory.CreateDirectory(contentDir);
                if (File.Exists(newPath)) File.Delete(newPath);
                File.Move(oldPath, newPath);
            }
        }
        catch { /* ignore file ops */ }
    }
    return Results.Ok(new { id = updated.Id.ToString(), updated.Title, updated.Date, updated.Summary, updated.Slug, updated.Tags, updated.Published });
}).RequireAuthorization();

// Auth endpoints
app.MapPost("/api/auth/login", ([FromBody] LoginRequest req) =>
{
    var adminUser = Environment.GetEnvironmentVariable("ADMIN_USER") ?? "admin";
    var adminPass = Environment.GetEnvironmentVariable("ADMIN_PASS") ?? "admin123";
    if (!string.Equals(req.Username, adminUser, StringComparison.Ordinal) || !string.Equals(req.Password, adminPass, StringComparison.Ordinal))
    {
        return Results.Unauthorized();
    }

    var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, req.Username),
        new Claim(ClaimTypes.Name, req.Username),
        new Claim(ClaimTypes.Role, "admin")
    };
    var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: creds
    );
    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
    return Results.Json(new { token = tokenString });
});

app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
{
    if (user?.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }
    var name = user.Identity?.Name ?? "admin";
    var roles = user.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToArray();
    return Results.Json(new { name, roles });
}).RequireAuthorization();

// Update a post by sending Id in body
app.MapPut("/api/posts", async (IMongoDatabase db, PostUpdateWithId req) =>
{
    if (!ObjectId.TryParse(req.Id, out var oid))
    {
        return Results.BadRequest("invalid id format");
    }

    var col = db.GetCollection<Post>("posts");
    var existing = await col.Find(p => p.Id == oid).FirstOrDefaultAsync();
    if (existing is null) return Results.NotFound();

    var oldSlug = existing.Slug;
    string? desiredSlug = null;
    var slugProvided = req.Slug is not null;
    if (slugProvided)
    {
        desiredSlug = req.Slug;
        if (!string.IsNullOrWhiteSpace(desiredSlug))
        {
            var slugExists = await col.Find(x => x.Slug == desiredSlug && x.Id != oid).AnyAsync();
            if (slugExists)
            {
                return Results.Conflict("slug already exists");
            }
        }
    }
    else if (req.Title is not null)
    {
        desiredSlug = Slugify(req.Title);
        if (!string.Equals(desiredSlug, oldSlug, StringComparison.OrdinalIgnoreCase))
        {
            var baseSlug = desiredSlug;
            var i = 2;
            while (await col.Find(x => x.Slug == desiredSlug && x.Id != oid).AnyAsync())
            {
                desiredSlug = $"{baseSlug}-{i}";
                i++;
                if (i > 200) break;
            }
        }
    }

    var updates = new List<UpdateDefinition<Post>>();
    var ub = Builders<Post>.Update;
    if (req.Title is not null) updates.Add(ub.Set(p => p.Title, req.Title));
    if (req.Date is not null) updates.Add(ub.Set(p => p.Date, req.Date));
    if (req.Summary is not null) updates.Add(ub.Set(p => p.Summary, req.Summary));
    if (desiredSlug is not null && !string.Equals(desiredSlug, oldSlug, StringComparison.Ordinal))
        updates.Add(ub.Set(p => p.Slug, desiredSlug));
    if (req.Tags is not null) updates.Add(ub.Set(p => p.Tags, req.Tags));
    if (req.Body is not null) updates.Add(ub.Set(p => p.Body, req.Body));
    if (req.Published is not null) updates.Add(ub.Set(p => p.Published, req.Published.Value));

    if (updates.Count == 0)
    {
        return Results.BadRequest("no fields to update");
    }

    var result = await col.UpdateOneAsync(p => p.Id == oid, ub.Combine(updates));
    if (result.MatchedCount == 0)
    {
        return Results.NotFound();
    }

    var updated = await col.Find(p => p.Id == oid).FirstOrDefaultAsync();
    if (updated is null) return Results.NotFound();
    if (!string.IsNullOrWhiteSpace(oldSlug) && !string.IsNullOrWhiteSpace(updated.Slug) && !string.Equals(oldSlug, updated.Slug, StringComparison.Ordinal))
    {
        try
        {
            var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
                ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
            var oldPath = Path.Combine(contentDir, $"{oldSlug}.mdx");
            var newPath = Path.Combine(contentDir, $"{updated.Slug}.mdx");
            if (File.Exists(oldPath))
            {
                Directory.CreateDirectory(contentDir);
                if (File.Exists(newPath)) File.Delete(newPath);
                File.Move(oldPath, newPath);
            }
        }
        catch { }
    }
    return Results.Ok(new { id = updated.Id.ToString(), updated.Title, updated.Date, updated.Summary, updated.Slug, updated.Tags, updated.Published });
});

static string EscapeYaml(string input)
{
    return input.Replace("\"", "\\\"");
}

static string Slugify(string input)
{
    if (string.IsNullOrWhiteSpace(input)) return "post";
    var s = input.Trim().ToLowerInvariant();
    // Basic transliteration for Turkish characters
    s = s
        .Replace("ğ", "g").Replace("ü", "u").Replace("ş", "s")
        .Replace("ı", "i").Replace("i̇", "i").Replace("ö", "o").Replace("ç", "c")
        .Replace("Ğ", "g").Replace("Ü", "u").Replace("Ş", "s")
        .Replace("İ", "i").Replace("I", "i").Replace("Ö", "o").Replace("Ç", "c");
    s = Regex.Replace(s, @"[^a-z0-9\s-_]", "");
    s = Regex.Replace(s, @"[\s-_]+", "-");
    s = s.Trim('-');
    return string.IsNullOrWhiteSpace(s) ? "post" : s;
}

// Delete a post by its ObjectId string
app.MapDelete("/api/posts/{id}", async (IMongoDatabase db, string id) =>
{
    if (!ObjectId.TryParse(id, out var oid))
    {
        return Results.BadRequest("invalid id format");
    }

    var col = db.GetCollection<Post>("posts");
    var result = await col.DeleteOneAsync(p => p.Id == oid);
    return result.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
}).RequireAuthorization();

// Cleanup: delete posts with null or missing key fields
app.MapDelete("/api/posts/cleanup/nulls", async (IMongoDatabase db) =>
{
    var bcol = db.GetCollection<BsonDocument>("posts");
    var f = Builders<BsonDocument>.Filter.Or(
        Builders<BsonDocument>.Filter.Eq("title", BsonNull.Value),
        Builders<BsonDocument>.Filter.Exists("title", false),
        Builders<BsonDocument>.Filter.Eq("date", BsonNull.Value),
        Builders<BsonDocument>.Filter.Exists("date", false),
        Builders<BsonDocument>.Filter.Eq("summary", BsonNull.Value),
        Builders<BsonDocument>.Filter.Exists("summary", false),
        Builders<BsonDocument>.Filter.Eq("slug", BsonNull.Value),
        Builders<BsonDocument>.Filter.Exists("slug", false)
    );

    var result = await bcol.DeleteManyAsync(f);
    return Results.Ok(new { deleted = result.DeletedCount });
}).RequireAuthorization();

// Simple DB health check: pings MongoDB and returns status
app.MapGet("/api/health/db", async ([FromServices] IMongoDatabase db) =>
{
    try
    {
        var pingCmd = new BsonDocument("ping", 1);
        await db.RunCommandAsync<BsonDocument>(pingCmd);
        return Results.Ok(new { ok = true });
    }
    catch (Exception ex)
    {
        return Results.Problem(title: "MongoDB connection failed", detail: ex.Message);
    }
});


// Tracking: unique visitors by IP (no auth)
app.MapPost("/api/track/visit", async (IMongoDatabase db, HttpContext ctx) =>
{
    var ip = GetClientIp(ctx);
    if (string.IsNullOrWhiteSpace(ip)) return Results.BadRequest();
    var col = db.GetCollection<Visitor>("visitors");
    var existing = await col.Find(x => x.Ip == ip).FirstOrDefaultAsync();
    if (existing is null)
    {
        await col.InsertOneAsync(new Visitor
        {
            Id = ObjectId.GenerateNewId(),
            Ip = ip,
            FirstSeen = DateTime.UtcNow,
            LastSeen = DateTime.UtcNow
        });
    }
    else
    {
        var update = Builders<Visitor>.Update.Set(v => v.LastSeen, DateTime.UtcNow);
        await col.UpdateOneAsync(v => v.Id == existing.Id, update);
    }
    return Results.Ok(new { ok = true });
});

// Tracking: unique CV downloads by IP (no auth)
app.MapPost("/api/track/cv", async (IMongoDatabase db, HttpContext ctx) =>
{
    var ip = GetClientIp(ctx);
    if (string.IsNullOrWhiteSpace(ip)) return Results.BadRequest();
    var col = db.GetCollection<CvDownload>("cv_downloads");
    var existing = await col.Find(x => x.Ip == ip).FirstOrDefaultAsync();
    if (existing is null)
    {
        await col.InsertOneAsync(new CvDownload
        {
            Id = ObjectId.GenerateNewId(),
            Ip = ip,
            FirstDownloaded = DateTime.UtcNow,
            LastDownloaded = DateTime.UtcNow
        });
    }
    else
    {
        var update = Builders<CvDownload>.Update.Set(v => v.LastDownloaded, DateTime.UtcNow);
        await col.UpdateOneAsync(v => v.Id == existing.Id, update);
    }
    return Results.Ok(new { ok = true });
});

// Admin stats (auth required)
app.MapGet("/api/stats", async (IMongoDatabase db) =>
{
    var homeCol = db.GetCollection<HomeData>("home");
    var home = await homeCol.Find(FilterDefinition<HomeData>.Empty).FirstOrDefaultAsync();
    var projectCount = home?.Projects?.Count ?? 0;

    var postsCol = db.GetCollection<Post>("posts");
    var postsCount = await postsCol.CountDocumentsAsync(FilterDefinition<Post>.Empty);

    var visitorCol = db.GetCollection<Visitor>("visitors");
    var visitorsCount = await visitorCol.CountDocumentsAsync(FilterDefinition<Visitor>.Empty);

    var cvCol = db.GetCollection<CvDownload>("cv_downloads");
    var cvDownloads = await cvCol.CountDocumentsAsync(FilterDefinition<CvDownload>.Empty);

    return Results.Ok(new
    {
        projects = projectCount,
        posts = (int)postsCount,
        visitors = (int)visitorsCount,
        cvDownloads = (int)cvDownloads
    });
}).RequireAuthorization();

static string GetClientIp(HttpContext ctx)
{
    var xff = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
    if (!string.IsNullOrWhiteSpace(xff))
    {
        var first = xff.Split(',').Select(s => s.Trim()).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(first)) return first;
    }
    var ip = ctx.Connection.RemoteIpAddress;
    return ip is null ? string.Empty : ip.MapToIPv4().ToString();
}

app.Run();
