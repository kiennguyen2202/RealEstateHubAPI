using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Services
{
    public class OpenStreetMapAmenityService : IAmenityLookupService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<OpenStreetMapAmenityService> _logger;
        private readonly string _userAgent;
        private readonly string? _nominatimEmail;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private const double SearchRadiusMeters = 2500;
        private const int MaxAmenities = 15;

        // OSM tag keys (chuẩn hóa, không phải tiếng Việt)
        private static readonly string[] OSMTagKeys =
        {
            "amenity",
            "shop",
            "tourism",
            "leisure",
            "sport",
            "healthcare"
        };
        
        // Từ khóa tiếng Việt để tìm trong tag "name" hoặc "name:vi"
        private static readonly string[] VietnameseKeywords =
        {
            "Bệnh viện",
            "Phòng khám",
            "Siêu thị",
            "Trung tâm thương mại",
            "Chợ",
            "Nhà thuốc",
            "Công viên",
            "Nhà ga",
            "Sân bay",
            "Trung tâm",
            "Trường học",
            "Trường mầm non",
            "Trường tiểu học",
            "Trường THPT",
            "Đại học",
            "Bưu điện",
            "Ngân hàng",
            "ATM",
            "Trạm xăng",
            "Nhà hàng",
            "Quán ăn",
            "Cà phê",
            "Đại học",
            "Thư viện",
            "Rạp chiếu phim",
            "Phòng tập gym",
            "Sân vận động",

        };

        public OpenStreetMapAmenityService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<OpenStreetMapAmenityService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _userAgent = configuration["App:UserAgent"] ?? "RealEstateHub/1.0";
            _nominatimEmail = configuration["Nominatim:Email"];
        }

        public async Task<IReadOnlyList<AmenityInfo>> GetNearbyAmenitiesAsync(string? address, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(address))
            {
                return Array.Empty<AmenityInfo>();
            }

            try
            {
                var (lat, lon) = await GeocodeAddressAsync(address, cancellationToken);
                if (lat is null || lon is null)
                {
                    return Array.Empty<AmenityInfo>();
                }

                var amenities = await QueryAmenitiesAsync(lat.Value, lon.Value, cancellationToken);
                return amenities;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup amenities for address {Address}", address);
                return Array.Empty<AmenityInfo>();
            }
        }

        private async Task<(double? lat, double? lon)> GeocodeAddressAsync(string address, CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient(nameof(OpenStreetMapAmenityService));
            var builder = new StringBuilder("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=");
            builder.Append(WebUtility.UrlEncode(address));
            if (!string.IsNullOrWhiteSpace(_nominatimEmail))
            {
                builder.Append("&email=").Append(WebUtility.UrlEncode(_nominatimEmail));
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, builder.ToString());
            request.Headers.UserAgent.ParseAdd(_userAgent);

            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Nominatim geocode request failed: {Status}", response.StatusCode);
                return (null, null);
            }

            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            var results = JsonSerializer.Deserialize<List<NominatimResult>>(payload, JsonOptions);
            var first = results?.FirstOrDefault();
            if (first is null) return (null, null);

            if (double.TryParse(first.lat, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) &&
                double.TryParse(first.lon, NumberStyles.Float, CultureInfo.InvariantCulture, out var lon))
            {
                return (lat, lon);
            }

            return (null, null);
        }

        private async Task<IReadOnlyList<AmenityInfo>> QueryAmenitiesAsync(double lat, double lon, CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient(nameof(OpenStreetMapAmenityService));

            var latStr = lat.ToString(CultureInfo.InvariantCulture);
            var lonStr = lon.ToString(CultureInfo.InvariantCulture);

            // Simplified query - only query OSM tags (faster)
            var builder = new StringBuilder();
            builder.AppendLine("[out:json][timeout:10];"); // Reduce timeout
            builder.AppendLine("(");
            
            // Only query most important tags to reduce load
            var importantTags = new[] { "amenity", "shop", "healthcare" };
            foreach (var tagKey in importantTags)
            {
                builder.AppendLine($"  node(around:{SearchRadiusMeters},{latStr},{lonStr})[\"{tagKey}\"];");
                builder.AppendLine($"  way(around:{SearchRadiusMeters},{latStr},{lonStr})[\"{tagKey}\"];");
            }
            builder.AppendLine(");");
            builder.AppendLine("out center 50;"); // Reduce output limit

            var allFeatures = new List<AmenityInfo>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            try
            {
                var query = builder.ToString();
                var results = await ExecuteOverpassQueryAsync(client, query, cancellationToken);
                ProcessOverpassResults(results, lat, lon, allFeatures, seen);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Overpass query failed, returning partial results");
            }

            var ordered = allFeatures
                .OrderBy(f => f.DistanceMeters ?? double.MaxValue)
                .Take(MaxAmenities)
                .ToList();
            return ordered;
        }

        private async Task<OverpassResponse?> ExecuteOverpassQueryAsync(HttpClient client, string query, CancellationToken cancellationToken)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://overpass-api.de/api/interpreter")
                {
                    Content = new StringContent($"data={WebUtility.UrlEncode(query)}", Encoding.UTF8, "application/x-www-form-urlencoded")
                };
                request.Headers.UserAgent.ParseAdd(_userAgent);

                // Use timeout from HttpClient configuration
                using var response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Overpass request failed: {Status}", response.StatusCode);
                    return null;
                }

                var payload = await response.Content.ReadAsStringAsync(cancellationToken);
                return JsonSerializer.Deserialize<OverpassResponse>(payload, JsonOptions);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Overpass request timeout");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Overpass request error");
                return null;
            }
        }

        private void ProcessOverpassResults(OverpassResponse? data, double lat, double lon, List<AmenityInfo> features, HashSet<string> seen)
        {
            if (data?.elements == null || data.elements.Count == 0)
            {
                return;
            }

            foreach (var element in data.elements)
            {
                var tags = element.tags ?? new Dictionary<string, string>();
                
                // Ưu tiên name:vi, fallback về name
                tags.TryGetValue("name:vi", out var name);
                if (string.IsNullOrWhiteSpace(name))
                {
                    tags.TryGetValue("name", out name);
                }
                
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                // Xác định category từ tags
                string? categoryKey = null;
                string? categoryValue = null;
                foreach (var key in OSMTagKeys)
                {
                    if (tags.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
                    {
                        categoryKey = key;
                        categoryValue = value;
                        break;
                    }
                }

                // Nếu không có OSM tag, thử suy luận từ tên tiếng Việt
                if (categoryKey is null)
                {
                    foreach (var keyword in VietnameseKeywords)
                    {
                        if (name.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                        {
                            categoryKey = "name";
                            categoryValue = keyword;
                            break;
                        }
                    }
                }

                var dedupeKey = $"{name}-{categoryKey}-{categoryValue}";
                if (!seen.Add(dedupeKey))
                {
                    continue;
                }

                var (itemLat, itemLon) = element.GetCoordinates();
                if (itemLat is null || itemLon is null)
                {
                    continue;
                }

                var distance = CalculateDistanceMeters(lat, lon, itemLat.Value, itemLon.Value);
                var category = MapCategory(categoryKey ?? "Tiện ích", categoryValue);

                features.Add(new AmenityInfo
                {
                    Name = name,
                    Category = category,
                    DistanceMeters = distance,
                    Lat = itemLat.Value,
                    Lon = itemLon.Value
                });

                if (features.Count >= MaxAmenities)
                {
                    return;
                }
            }
        }

        private static string MapCategory(string key, string? value)
        {
            var normalized = value?.Replace('_', ' ').Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                normalized = key;
            }

            var textInfo = CultureInfo.GetCultureInfo("vi-VN").TextInfo;
            return textInfo.ToTitleCase(normalized);
        }

        private static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000; // meters
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private static double ToRadians(double deg) => deg * Math.PI / 180.0;

        private sealed class NominatimResult
        {
            public string? lat { get; set; }
            public string? lon { get; set; }
        }

        private sealed class OverpassResponse
        {
            public List<OverpassElement>? elements { get; set; }
        }

        private sealed class OverpassElement
        {
            public string? type { get; set; }
            public double? lat { get; set; }
            public double? lon { get; set; }
            public OverpassCenter? center { get; set; }
            public Dictionary<string, string>? tags { get; set; }

            public (double? Lat, double? Lon) GetCoordinates()
            {
                if (lat.HasValue && lon.HasValue)
                {
                    return (lat, lon);
                }

                if (center != null && center.lat.HasValue && center.lon.HasValue)
                {
                    return (center.lat, center.lon);
                }

                return (null, null);
            }
        }

        private sealed class OverpassCenter
        {
            public double? lat { get; set; }
            public double? lon { get; set; }
        }
    }
}

