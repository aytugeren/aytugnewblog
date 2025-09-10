using MongoDB.Driver;
using MongoDB.Bson;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
// Use IPv4 loopback by default to avoid localhost -> ::1 resolution issues
var mongoConn = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING");
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DB_NAME");
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConn));
builder.Services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDbName));
// Caching
builder.Services.AddMemoryCache();

// Auth configuration
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "default_secret_key";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
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

// CORS: allow configurable origins (IP/domain) + localhost by default
const string CorsPolicy = "DefaultCors";
var corsEnv = Environment.GetEnvironmentVariable("CORS_ORIGINS");
var defaultOrigins = new[]
{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // Common deployments (adjustable via CORS_ORIGINS)
    "http://161.97.97.216:4000",
    "http://aytugeren.com",
    "https://aytugeren.com",
    "http://www.aytugeren.com",
    "https://www.aytugeren.com",
};
var origins = string.IsNullOrWhiteSpace(corsEnv)
    ? defaultOrigins
    : corsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: CorsPolicy, policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
              // .AllowCredentials(); // enable if sending cookies/auth
    });
});

var app = builder.Build();
var homeTtlSec = int.TryParse(Environment.GetEnvironmentVariable("CACHE_TTL_HOME_SECONDS"), out var _h) ? _h : 120;
var postsTtlSec = int.TryParse(Environment.GetEnvironmentVariable("CACHE_TTL_POSTS_SECONDS"), out var _p) ? _p : 120;

// Use CORS before mapping endpoints
app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/home", async (IMongoDatabase db, IMemoryCache cache) =>
{
    var key = "home_doc";
    if (cache.TryGetValue(key, out HomeData? c) && c is not null)
        return Results.Json(c);
    var col = db.GetCollection<HomeData>("home");
    var data = await col.Find(FilterDefinition<HomeData>.Empty).FirstOrDefaultAsync();
    if (data is null)
        return Results.NotFound();
    cache.Set(key, data, TimeSpan.FromSeconds(homeTtlSec));
    return Results.Json(data);
});

// Upsert HomeData (create if not exists, otherwise replace). Auth required.
app.MapPost("/api/home/upsert", async (IMongoDatabase db, [FromBody] HomeUpsertRequest req) =>
{
    var col = db.GetCollection<HomeData>("home");
    var existing = await col.Find(FilterDefinition<HomeData>.Empty).FirstOrDefaultAsync();

    // Normalize incoming payload
    var skills = req.Skills ?? new Dictionary<string, List<Skill>>();
    var experiences = req.Experiences ?? new List<Experience>();
    var projects = req.Projects ?? new List<Project>();
    var posts = existing?.Posts ?? req.Posts ?? new List<Post>();
    var ongoing = req.OngoingProjects ?? new List<OngoingProject>();
    var hasCv = req.HasCv ?? existing?.HasCv ?? false;

    var doc = new HomeData
    {
        Id = existing?.Id ?? ObjectId.GenerateNewId(),
        HeroTitle = req.HeroTitle ?? existing?.HeroTitle,
        HeroSubtitle = req.HeroSubtitle ?? existing?.HeroSubtitle,
        Skills = skills,
        Experiences = experiences,
        Projects = projects,
        Posts = posts,
        HasCv = hasCv,
        OngoingProjects = ongoing,
    };

    if (existing is null)
    {
        await col.InsertOneAsync(doc);
        return Results.Ok(new { ok = true, created = true, id = doc.Id.ToString() });
    }
    else
    {
        await col.ReplaceOneAsync(x => x.Id == existing.Id, doc);
        return Results.Ok(new { ok = true, created = false, id = doc.Id.ToString() });
    }
}).RequireAuthorization();

// Upload CV (PDF). Saves to a fixed path inside backend container. Auth required.
app.MapPost("/api/upload/cv", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("multipart/form-data bekleniyor");

    var form = await request.ReadFormAsync();
    var file = form.Files["file"];
    if (file is null || file.Length == 0)
        return Results.BadRequest("dosya yok");

    // Basic validation: PDF up to ~20MB
    if (file.ContentType is not null && !file.ContentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest("PDF bekleniyor");
    const long maxSize = 20 * 1024 * 1024;
    if (file.Length > maxSize)
        return Results.BadRequest("dosya boyutu buyuk");

    var targetPath = Environment.GetEnvironmentVariable("CV_PATH");
    if (string.IsNullOrWhiteSpace(targetPath))
    {
        // Default within app folder; Next.js will proxy via /cv.pdf route
        targetPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "cv.pdf"));
    }
    var dir = Path.GetDirectoryName(targetPath);
    if (!string.IsNullOrWhiteSpace(dir)) Directory.CreateDirectory(dir);

    using (var fs = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None))
    {
        await file.CopyToAsync(fs);
    }

    return Results.Ok(new { ok = true, saved = targetPath });
}).RequireAuthorization();

// Serve CV PDF (public). Streams file saved by /api/upload/cv
app.MapGet("/api/files/cv", () =>
{
    var targetPath = Environment.GetEnvironmentVariable("CV_PATH");
    if (string.IsNullOrWhiteSpace(targetPath))
        targetPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "cv.pdf"));
    if (!System.IO.File.Exists(targetPath))
        return Results.NotFound();
    var stream = new FileStream(targetPath, FileMode.Open, FileAccess.Read, FileShare.Read);
    return Results.File(stream, "application/pdf", enableRangeProcessing: true);
});

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
app.MapPost("/api/posts", async (IMongoDatabase db, IMemoryCache cache, PostCreate req) =>
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

    await postsCol.InsertOneAsync(post); cache.Remove("posts_all"); cache.Remove($"post_{post.Slug}");

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

    // Try to write JSON representation under generated/post
    try
    {
        var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
            ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
        Directory.CreateDirectory(jsonDir);
        var jsonPath = Path.Combine(jsonDir, $"{post.Slug}.json");
        var payload = new
        {
            title = post.Title,
            date = post.Date,
            summary = post.Summary,
            slug = post.Slug,
            tags = post.Tags ?? new List<string>(),
            published = post.Published,
            body = post.Body,
        };
        var json = JsonSerializer.Serialize(payload);
        await File.WriteAllTextAsync(jsonPath, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
    catch { }

    return Results.Created($"/api/posts/{post.Slug}", new { id = post.Id.ToString(), post.Title, post.Date, post.Summary, post.Slug, post.Tags });
}).RequireAuthorization();

// Update a post by ObjectId in route, partial update supported
app.MapPut("/api/posts/{id}", async (IMongoDatabase db, IMemoryCache cache, string id, PostUpdate update) =>
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
            // Remove old JSON file if exists; a new one will be written below
            try
            {
                var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
                    ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
                var oldJson = Path.Combine(jsonDir, $"{oldSlug}.json");
                if (File.Exists(oldJson)) File.Delete(oldJson);
            }
            catch { }
        }
        catch { /* ignore file ops */ }
    }
    // Also refresh JSON representation
    try
    {
        var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
            ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
        Directory.CreateDirectory(jsonDir);
        var jsonPath = Path.Combine(jsonDir, $"{updated.Slug}.json");
        var payload = new
        {
            title = updated.Title,
            date = updated.Date,
            summary = updated.Summary,
            slug = updated.Slug,
            tags = updated.Tags ?? new List<string>(),
            published = updated.Published,
            body = updated.Body,
        };
        var json = JsonSerializer.Serialize(payload);
        await File.WriteAllTextAsync(jsonPath, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
    catch { }
    // Also refresh JSON representation
    try
    {
        var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
            ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
        Directory.CreateDirectory(jsonDir);
        var jsonPath = Path.Combine(jsonDir, $"{updated.Slug}.json");
        var payload = new
        {
            title = updated.Title,
            date = updated.Date,
            summary = updated.Summary,
            slug = updated.Slug,
            tags = updated.Tags ?? new List<string>(),
            published = updated.Published,
            body = updated.Body,
        };
        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        await File.WriteAllTextAsync(jsonPath, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
    catch { }
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
        // Remove old JSON file if exists; a new one will be written below
        try
        {
            var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
                ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
            var oldJson = Path.Combine(jsonDir, $"{oldSlug}.json");
            if (File.Exists(oldJson)) File.Delete(oldJson);
        }
        catch { }
    }
    // Refresh MDX file with latest fields (best-effort)
    try
    {
        var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
            ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
        Directory.CreateDirectory(contentDir);
        var mdxPath = Path.Combine(contentDir, $"{updated.Slug}.mdx");
        var sb = new StringBuilder();
        sb.AppendLine("---");
        sb.AppendLine($"title: \"{EscapeYaml(updated.Title)}\"");
        sb.AppendLine($"date: \"{updated.Date}\"");
        if (!string.IsNullOrWhiteSpace(updated.Summary)) sb.AppendLine($"summary: \"{EscapeYaml(updated.Summary)}\"");
        if (updated.Tags is { Count: > 0 })
        {
            sb.AppendLine("tags:");
            foreach (var t in updated.Tags)
            {
                sb.AppendLine($"  - {EscapeYaml(t)}");
            }
        }
        sb.AppendLine($"published: {(updated.Published ? "true" : "false")}");
        sb.AppendLine("---");
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(updated.Body))
        {
            sb.AppendLine(updated.Body);
        }
        await File.WriteAllTextAsync(mdxPath, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
    catch { }
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
app.MapDelete("/api/posts/{id}", async (IMongoDatabase db, IMemoryCache cache, string id) =>
{
    if (!ObjectId.TryParse(id, out var oid))
    {
        return Results.BadRequest("invalid id format");
    }

    var col = db.GetCollection<Post>("posts");
    var doc = await col.Find(p => p.Id == oid).FirstOrDefaultAsync();
    var result = await col.DeleteOneAsync(p => p.Id == oid); cache.Remove("posts_all");
    if (result.DeletedCount == 0)
    {
        return Results.NotFound();
    }
    // Best-effort: remove MDX and JSON file
    try
    {
        if (doc is not null)
        {
            var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
                ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
            var path = Path.Combine(contentDir, $"{doc.Slug}.mdx");
            if (File.Exists(path)) File.Delete(path);
            var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
                ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../public/generated/post"));
            var jsonPath = Path.Combine(jsonDir, $"{doc.Slug}.json");
            if (File.Exists(jsonPath)) File.Delete(jsonPath);
        }
    }
    catch { }
    return Results.NoContent();
}).RequireAuthorization();

// Cleanup: delete posts with null or missing key fields
app.MapDelete("/api/posts/cleanup/nulls", async (IMongoDatabase db, IMemoryCache cache) =>
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
    cache.Remove("home_doc"); return Results.Ok(new { deleted = result.DeletedCount });
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

// Export all DB posts to content/posts as MDX (auth)
app.MapPost("/api/posts/sync/files", async (IMongoDatabase db) =>
{
    var col = db.GetCollection<Post>("posts");
    var posts = await col.Find(FilterDefinition<Post>.Empty).ToListAsync();
    var contentDir = Environment.GetEnvironmentVariable("CONTENT_DIR")
        ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../content/posts"));
    Directory.CreateDirectory(contentDir);

    var written = 0;
    var jsonWritten = 0;
    var jsonDir = Environment.GetEnvironmentVariable("JSON_DIR")
        ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../.contentlayer/generated/post"));
    Directory.CreateDirectory(jsonDir);
    foreach (var p in posts)
    {
        try
        {
            var mdxPath = Path.Combine(contentDir, $"{p.Slug}.mdx");
            var sb = new StringBuilder();
            sb.AppendLine("---");
            sb.AppendLine($"title: \"{EscapeYaml(p.Title)}\"");
            sb.AppendLine($"date: \"{p.Date}\"");
            if (!string.IsNullOrWhiteSpace(p.Summary)) sb.AppendLine($"summary: \"{EscapeYaml(p.Summary)}\"");
            if (p.Tags is { Count: > 0 })
            {
                sb.AppendLine("tags:");
                foreach (var t in p.Tags)
                {
                    sb.AppendLine($"  - {EscapeYaml(t)}");
                }
            }
            sb.AppendLine($"published: {(p.Published ? "true" : "false")}");
            sb.AppendLine("---");
            sb.AppendLine();
            if (!string.IsNullOrWhiteSpace(p.Body)) sb.AppendLine(p.Body);
            await File.WriteAllTextAsync(mdxPath, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            written++;
            // JSON per post
            try
            {
                var jsonPath = Path.Combine(jsonDir, $"posts__{p.Slug}.mdx.json");
                var payload = new
                {
                    title = p.Title,
                    date = p.Date,
                    summary = p.Summary,
                    slug = p.Slug,
                    tags = p.Tags ?? new List<string>(),
                    published = p.Published,
                    body = p.Body,
                };
                var json = JsonSerializer.Serialize(payload);
                await File.WriteAllTextAsync(jsonPath, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
                jsonWritten++;
            }
            catch { }
        }
        catch { /* ignore single file errors */ }
    }

    return Results.Ok(new { total = posts.Count, written, dir = contentDir, mdxDir = contentDir, jsonWritten, jsonDir });
}).RequireAuthorization();

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

// Contact: save contact messages (no auth)
app.MapPost("/api/contact", async (IMongoDatabase db, IMemoryCache cache, HttpContext ctx, [FromBody] ContactRequest req) =>
{
    // Basic validation
    if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Message))
    {
        return Results.BadRequest("name, email and message are required");
    }

    // Honeypot: if filled, act like success without storing
    if (!string.IsNullOrWhiteSpace(req.Hp))
    {
        await Task.Delay(200); // small delay to mimic processing
        return Results.Ok(new { ok = true });
    }

    // Timestamp guard: require at least 2s after render and max 1h old
    var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    if (req.Ts is long ts)
    {
        var diff = nowUnix - ts;
        if (diff < 2 || diff > 3600)
        {
            return Results.StatusCode(429);
        }
    }

    // Per-IP rate limiting: 3/min and 10/10min
    var ipForRl = GetClientIp(ctx);
    var ipKey = string.IsNullOrWhiteSpace(ipForRl) ? "unknown" : ipForRl;

    bool Exceeded(string key, TimeSpan window, int limit)
    {
        var now = DateTime.UtcNow;
        var entry = cache.Get<(int Count, DateTime WindowStart)>(key);
        if (entry.WindowStart == default)
        {
            cache.Set(key, (1, now), new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = window });
            return false;
        }
        var count = entry.Count + 1;
        cache.Set(key, (count, entry.WindowStart), new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = window });
        return count > limit;
    }

    if (Exceeded($"contact_rl_min_{ipKey}", TimeSpan.FromMinutes(1), 3)
        || Exceeded($"contact_rl_10m_{ipKey}", TimeSpan.FromMinutes(10), 10))
    {
        return Results.StatusCode(429);
    }

    // Duplicate content guard for same IP within 5 minutes
    var bodyHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(req.Message.Trim())));
    var lastKey = $"contact_last_{ipKey}";
    var lastHash = cache.Get<string>(lastKey);
    if (!string.IsNullOrEmpty(lastHash) && string.Equals(lastHash, bodyHash, StringComparison.Ordinal))
    {
        return Results.StatusCode(429);
    }
    cache.Set(lastKey, bodyHash, TimeSpan.FromMinutes(5));

    var col = db.GetCollection<ContactMessage>("contact_messages");
    var ip = ipForRl;
    var ua = ctx.Request.Headers["User-Agent"].FirstOrDefault();
    var doc = new ContactMessage
    {
        Id = ObjectId.GenerateNewId(),
        Name = req.Name.Trim().Substring(0, Math.Min(req.Name.Trim().Length, 100)),
        Email = req.Email.Trim().Substring(0, Math.Min(req.Email.Trim().Length, 200)),
        Message = req.Message.Trim().Substring(0, Math.Min(req.Message.Trim().Length, 2000)),
        CreatedAt = DateTime.UtcNow,
        Ip = string.IsNullOrWhiteSpace(ip) ? null : ip,
        UserAgent = string.IsNullOrWhiteSpace(ua) ? null : ua
    };
    await col.InsertOneAsync(doc);
    return Results.Ok(new { id = doc.Id.ToString() });
});

// Contact: list messages (auth)
app.MapGet("/api/contact", async (IMongoDatabase db, int skip, int limit) =>
{
    var col = db.GetCollection<ContactMessage>("contact_messages");
    if (limit <= 0 || limit > 200) limit = 50;
    if (skip < 0) skip = 0;
    var list = await col
        .Find(FilterDefinition<ContactMessage>.Empty)
        .SortByDescending(x => x.CreatedAt)
        .Skip(skip)
        .Limit(limit)
        .ToListAsync();
    var result = list.Select(c => new
    {
        id = c.Id.ToString(),
        c.Name,
        c.Email,
        c.Message,
        createdAt = c.CreatedAt,
        c.Ip,
        c.UserAgent
    });
    return Results.Json(result);
}).RequireAuthorization();

// Contact: count (public)
app.MapGet("/api/contact/count", async (IMongoDatabase db) =>
{
    var col = db.GetCollection<ContactMessage>("contact_messages");
    var count = await col.CountDocumentsAsync(FilterDefinition<ContactMessage>.Empty);
    return Results.Ok(new { count = (int)count });
});

// Contact: delete single (auth)
app.MapDelete("/api/contact/{id}", async (IMongoDatabase db, string id) =>
{
    if (!ObjectId.TryParse(id, out var oid))
    {
        return Results.BadRequest("invalid id");
    }
    var col = db.GetCollection<ContactMessage>("contact_messages");
    var result = await col.DeleteOneAsync(c => c.Id == oid);
    return result.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
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



