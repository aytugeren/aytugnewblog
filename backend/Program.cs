using LiteDB;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<LiteDatabase>(_ => new LiteDatabase("home.db"));

var app = builder.Build();

app.MapGet("/api/home", (LiteDatabase db) =>
{
    var col = db.GetCollection<HomeData>("home");
    var data = col.FindById(1);
    if (data == null)
    {
        data = new HomeData
        {
            Id = 1,
            Highlights = new List<string>
            {
                "10+ yıl tecrübe",
                ".NET 9 + Next.js",
                "Elasticsearch & PostgreSQL",
                "Bulut & CI/CD"
            },
            Skills = new Dictionary<string, List<Skill>>
            {
                ["Backend"] = new()
                {
                    new Skill(".NET", "İleri"),
                    new Skill("EF Core", "İleri"),
                    new Skill("PostgreSQL", "İleri"),
                    new Skill("Redis", "Orta")
                },
                ["Frontend"] = new()
                {
                    new Skill("Next.js", "İleri"),
                    new Skill("TypeScript", "İleri"),
                    new Skill("Tailwind", "İleri"),
                    new Skill("shadcn/ui", "Orta")
                },
                ["DevOps"] = new()
                {
                    new Skill("Docker", "İleri"),
                    new Skill("GitHub Actions", "İleri"),
                    new Skill("Vercel", "İleri"),
                    new Skill("Fly.io", "Orta")
                },
                ["Data/Search"] = new()
                {
                    new Skill("Elasticsearch", "İleri"),
                    new Skill("Kibana", "Orta")
                }
            },
            Experiences = new List<Experience>
            {
                new(
                    "Acme Corp",
                    "Senior Engineer",
                    "2021 – Günümüz",
                    new List<string>
                    {
                        "Mikroservis mimarisiyle ölçeklenebilir API'ler tasarladım.",
                        "%40 performans artışı sağlayan cache stratejileri geliştirdim.",
                        "Takım mentörlüğü ve code review süreçlerini yönettim."
                    }
                ),
                new(
                    "Globex",
                    "Fullstack Developer",
                    "2018 – 2021",
                    new List<string>
                    {
                        "React ve .NET ile kurumsal dashboard geliştirdim.",
                        "CI/CD pipeline'ları kurarak deploy süresini %60 azalttım."
                    }
                ),
                new(
                    "Initech",
                    "Software Engineer",
                    "2014 – 2018",
                    new List<string>
                    {
                        "Monolitik sistemi servis tabanlı mimariye taşıdım.",
                        "Elasticsearch arama deneyimini optimize ettim."
                    }
                )
            },
            Projects = new List<Project>
            {
                new(
                    "Realtime Analytics",
                    "Gerçek zamanlı veri işleyen ve dashboard sunan SaaS platformu.",
                    new List<string>{"Next.js", "Elasticsearch", "Redis"},
                    "/projects/realtime-analytics"
                ),
                new(
                    "E-commerce Core",
                    "Ölçeklenebilir .NET 9 tabanlı e-ticaret çekirdek kütüphanesi.",
                    new List<string>{".NET", "PostgreSQL", "Docker"},
                    "/projects/ecommerce-core"
                ),
                new(
                    "Team Productivity",
                    "Takımlar için görev ve zaman yönetimi sağlayan web uygulaması.",
                    new List<string>{"Next.js", "TypeScript", "Vercel"},
                    "/projects/team-productivity"
                )
            },
            Posts = new List<Post>
            {
                new("İlk Yazı", "2025-08-25", "Blog iskeletimiz hazır.", "hello-world"),
                new("İkinci Yazı", "2025-08-25", "Blog iskeletimiz hazır. Aytug", "secon-post")
            },
            HasCv = false
        };
        col.Insert(data);
    }
    return Results.Json(data);
});

app.Run();
