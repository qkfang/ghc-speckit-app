using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Sample App API",
        Version = "v1",
        Description = "REST API for Microsoft Sample App Season 4 — SpecKit episode."
    });
});

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Sample App API v1");
    options.RoutePrefix = "swagger";
});

// Load Season 4 episodes from JSON file once at startup; fail fast if missing/malformed.
var episodesJsonPath = Path.Combine(app.Environment.ContentRootPath, "episodes.json");
var episodesJson = File.ReadAllText(episodesJsonPath);
var season4Episodes = JsonSerializer.Deserialize<JsonElement[]>(episodesJson)
    ?? throw new InvalidOperationException("episodes.json deserialized to null");

// GET /api/status — runtime status
app.MapGet("/api/status", () => Results.Ok(new
{
    status = "running",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow.ToString("o")
}))
.WithName("GetStatus")
.WithSummary("Runtime status")
.WithDescription("Returns the current runtime status of the API.")
.WithTags("System");

// GET /api/health — health check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    uptime = Environment.TickCount64 / 1000.0,
    timestamp = DateTime.UtcNow.ToString("o")
}))
.WithName("GetHealth")
.WithSummary("Health check")
.WithDescription("Returns health status and uptime.")
.WithTags("System");

// GET /api/series — Sample App Season 4 series info
app.MapGet("/api/series", () => Results.Ok(new
{
    name = "Microsoft Sample App",
    season = 4,
    description = "Season 4 of Microsoft Sample App — hands-on sessions on agentic AI, DevOps automation, and developer experience upgrades.",
    topics = season4Episodes.Select(e => new
    {
        episode = e.GetProperty("episode").GetInt32(),
        title = e.GetProperty("title").GetString(),
        presenter = e.GetProperty("presenter").GetString(),
        status = e.GetProperty("status").GetString()
    })
}))
.WithName("GetSeries")
.WithSummary("Series information")
.WithDescription("Returns information about the Microsoft Sample App Season 4 series.")
.WithTags("Content");

// GET /api/episodes — all Season 4 episodes
app.MapGet("/api/episodes", () => Results.Ok(new
{
    season = 4,
    name = "Microsoft Sample App — Season 4",
    episodes = season4Episodes
}))
.WithName("GetEpisodes")
.WithSummary("All Season 4 episodes")
.WithDescription("Returns all episodes for Microsoft Sample App Season 4.")
.WithTags("Content");

// GET /api/episodes/{id} — single Season 4 episode by number
app.MapGet("/api/episodes/{id:int}", (int id) =>
{
    var episode = season4Episodes.FirstOrDefault(e => e.GetProperty("episode").GetInt32() == id);
    return episode.ValueKind != JsonValueKind.Undefined
        ? Results.Ok(episode)
        : Results.NotFound(new { error = $"Episode {id} not found" });
})
.WithName("GetEpisodeById")
.WithSummary("Episode by number")
.WithDescription("Returns a single episode by its episode number.")
.WithTags("Content");

// GET /api/episodes/search — keyword search across title and introduction
app.MapGet("/api/episodes/search", (string? q) =>
{
    var matches = string.IsNullOrEmpty(q)
        ? season4Episodes
        : season4Episodes.Where(e =>
            e.GetProperty("title").GetString()!.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            e.GetProperty("introduction").GetString()!.Contains(q, StringComparison.OrdinalIgnoreCase)).ToArray();

    return Results.Ok(new
    {
        season = 4,
        name = "Microsoft Sample App — Season 4",
        episodes = matches
    });
})
.WithName("SearchEpisodes")
.WithSummary("Search episodes")
.WithDescription("Searches episodes by keyword against title or introduction, case-insensitively.")
.WithTags("Content");

app.Run();

public partial class Program { }
