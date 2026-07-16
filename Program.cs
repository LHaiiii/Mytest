using System.Text.Json;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseFileServer(new FileServerOptions
{
    FileProvider = new PhysicalFileProvider(app.Environment.ContentRootPath),
    RequestPath = string.Empty,
    EnableDirectoryBrowsing = false
});

var storagePath = Path.Combine(app.Environment.ContentRootPath, "responses.json");
var fileLock = new object();

app.MapPost("/submit", (SubmissionRequest request) =>
{
    if (request.SelectedFoods is null || request.SelectedFoods.Count == 0)
    {
        return Results.BadRequest(new { message = "Vui lòng chọn ít nhất một món ăn." });
    }

    var record = new SubmissionRecord
    {
        Sender = request.Sender?.Trim() ?? string.Empty,
        SelectedFoods = request.SelectedFoods,
        Timestamp = DateTimeOffset.UtcNow.ToString("O"),
        Source = request.Source ?? "birthday-food-picker"
    };

    lock (fileLock)
    {
        List<SubmissionRecord> records = [];

        if (File.Exists(storagePath))
        {
            var existing = File.ReadAllText(storagePath);
            if (!string.IsNullOrWhiteSpace(existing))
            {
                records = JsonSerializer.Deserialize<List<SubmissionRecord>>(existing) ?? [];
            }
        }

        records.Add(record);
        File.WriteAllText(storagePath, JsonSerializer.Serialize(records, new JsonSerializerOptions { WriteIndented = true }));
    }

    return Results.Ok(new { status = "success", message = "Tôi sẽ bao bạn những món đó (nếu có thể)" });
});

app.MapGet("/results", () =>
{
    List<SubmissionRecord> records = [];

    if (File.Exists(storagePath))
    {
        var existing = File.ReadAllText(storagePath);
        if (!string.IsNullOrWhiteSpace(existing))
        {
            records = JsonSerializer.Deserialize<List<SubmissionRecord>>(existing) ?? [];
        }
    }

    return Results.Json(records);
});

app.MapGet("/", () => Results.Redirect("/results.html"));

app.Run();

public sealed class SubmissionRequest
{
    public string? Sender { get; set; }
    public List<string>? SelectedFoods { get; set; }
    public string? Source { get; set; }
}

public sealed class SubmissionRecord
{
    public string Sender { get; set; } = string.Empty;
    public List<string> SelectedFoods { get; set; } = [];
    public string Timestamp { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
}
