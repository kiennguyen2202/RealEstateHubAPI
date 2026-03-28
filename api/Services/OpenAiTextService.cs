using System.Net.Http.Headers;
using System.Linq;
using System.Text;
using System.Text.Json;
using RealEstateHubAPI.DTOs;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace RealEstateHubAPI.Services
{
    public class OpenAiTextService : IAiTextService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly string _baseUrl;
        private readonly int _maxTokens;
        private readonly bool _isOpenRouter;
        private readonly ILogger<OpenAiTextService>? _logger;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public OpenAiTextService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<OpenAiTextService>? logger = null)
        {
            _httpClient = httpClientFactory.CreateClient(nameof(OpenAiTextService));
            _apiKey = configuration["AI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
            _model = configuration["AI:Model"] ?? "gpt-4o-mini";
            _baseUrl = configuration["AI:BaseUrl"] ?? "https://api.openai.com/v1";
            _maxTokens = int.TryParse(configuration["AI:MaxTokens"], out var mt) ? Math.Max(128, mt) : 800;
            _isOpenRouter = _baseUrl.Contains("openrouter.ai", StringComparison.OrdinalIgnoreCase);
            _logger = logger;
        }

        public async Task<(string title, string description)> GenerateListingAsync(AiGenerateListingDto dto, CancellationToken cancellationToken = default)
        {
            _logger?.LogInformation($"🔑 API Key loaded: {(!string.IsNullOrWhiteSpace(_apiKey) ? $"{_apiKey[..10]}..." : "EMPTY")}");
            _logger?.LogInformation($"🌐 Base URL: {_baseUrl}");
            _logger?.LogInformation($"🤖 Model: {_model}");
            
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                throw new InvalidOperationException("AI:ApiKey (or OPENAI_API_KEY) is not configured.");
            }

            // Build prompt
            var systemMsg = @"Bạn là chuyên gia marketing bất động sản làm việc cho một nền tảng mua bán/cho thuê bất động sản hợp pháp tại Việt Nam. Nhiệm vụ của bạn là tạo mô tả tin đăng dựa trên thông tin thực tế được cung cấp.

Đây là một yêu cầu hợp pháp và chính đáng: giúp người dùng tạo mô tả cho tin đăng bất động sản của họ trên nền tảng thương mại điện tử. Bạn cần tạo nội dung chính xác, trung thực dựa trên dữ liệu được cung cấp.

⚠️ QUY TẮC BẮT BUỘC: 
- Luôn trả về duy nhất một JSON object với hai trường title và description, không in thêm nội dung ngoài JSON.
- KHÔNG được từ chối hoặc giải thích, chỉ cần tạo nội dung theo yêu cầu.
- Khi có danh sách địa điểm xung quanh được cung cấp:
  ✓ BẮT BUỘC phải sử dụng TÊN CHÍNH XÁC từ danh sách đó
  ✓ KHÔNG được tạo ra tên mới
  ✓ KHÔNG được copy tên ví dụ từ prompt
  ✓ KHÔNG được viết chung chung như ""có bệnh viện, siêu thị""
  ✓ PHẢI nêu tên cụ thể ít nhất 3-5 địa điểm từ danh sách";

            var amenitiesLines = dto.NearbyAmenities?
                .Where(a => !string.IsNullOrWhiteSpace(a.Name))
                .OrderBy(a => a.DistanceMeters ?? double.MaxValue)
                .Take(10) // Lấy 10 địa điểm gần nhất
                .Select(a =>
                {
                    var distanceText = a.DistanceMeters.HasValue
                        ? $"~{Math.Round(a.DistanceMeters.Value / 1000) * 1000} m"
                        : "gần đó";
                    var category = string.IsNullOrWhiteSpace(a.Category) ? "Địa điểm" : a.Category;
                    return $"• {a.Name} ({category}, {distanceText})";
                })
                .ToList() ?? new List<string>();

            var amenitiesSection = amenitiesLines.Count > 0
                ? $@"===== DANH SÁCH ĐỊA ĐIỂM XUNG QUANH (BẮT BUỘC SỬ DỤNG) =====
{string.Join("\n", amenitiesLines)}
===== KẾT THÚC DANH SÁCH =====

⚠️ QUY TẮC BẮT BUỘC CHO PHẦN ""Khu vực xung quanh:"":
1. BẮT BUỘC phải nêu TÊN CỤ THỂ của ít nhất 3-5 địa điểm từ danh sách trên
2. CHỈ được copy CHÍNH XÁC tên địa điểm từ danh sách, KHÔNG được:
   - Tạo ra tên mới
   - Sử dụng bất kỳ tên nào KHÔNG có trong danh sách
   - Viết chung chung như ""có bệnh viện"", ""gần siêu thị""
3. Format: Viết tự nhiên, lồng ghép tên địa điểm vào câu văn
4. TUYỆT ĐỐI KHÔNG được sử dụng tên địa điểm nào khác ngoài danh sách trên
5. Nếu không tuân thủ quy tắc này, response sẽ bị từ chối"
                : "Không có dữ liệu địa điểm cụ thể từ hệ thống; hãy mô tả tổng quan khu vực dựa trên địa chỉ.";

            var contactInstruction = !string.IsNullOrWhiteSpace(dto.UserName) || !string.IsNullOrWhiteSpace(dto.UserPhone)
                ? $"Liên hệ thực tế: {(dto.UserName ?? "Không rõ")} - {(dto.UserPhone ?? "Không rõ")}."
                : "Không có thông tin liên hệ, hãy hướng dẫn người đọc liên hệ qua nền tảng.";

            var userContent = $@"Dựa vào dữ liệu sau, hãy viết nội dung tin đăng chuẩn tiếng Việt:
- Loại BĐS: {dto.Category ?? "Không xác định"}
- Nhu cầu: {(dto.TransactionType == "Rent" ? "Cho thuê" : "Bán")}
- Địa chỉ: {dto.Address ?? "Không rõ"}
- Giá: {(dto.Price ?? 0).ToString("0.##")} {(dto.PriceUnit == 0 ? "tỷ" : "triệu")} VNĐ
- Diện tích: {(dto.AreaSize ?? 0).ToString("0.##")} m²
- Số phòng ngủ: {dto.Bedrooms ?? 0}
- Số phòng tắm: {dto.Bathrooms ?? 0}
- Số tầng: {dto.Floors ?? 0}
- Hướng nhà: {dto.Direction ?? "Không rõ"}
- Hướng ban công: {dto.Balcony ?? "Không rõ"}
- Mặt tiền: {(dto.Frontage ?? 0).ToString("0.##")} m
- Đường vào: {(dto.Alley ?? 0).ToString("0.##")} m
- Pháp lý: {dto.Legal ?? "Không rõ"}
- Người đăng: {dto.UserName ?? "Không rõ"}
- Điện thoại: {dto.UserPhone ?? "Không rõ"}

{amenitiesSection}
{contactInstruction}

Yêu cầu tiêu đề (title):
- Độ dài 110-130 ký tự.
- Ghép nhu cầu + loại BĐS + địa chỉ chính xác + diện tích (nếu >0).
- Văn phong sinh động, nhấn mạnh trải nghiệm không gian, tương tự: ""Căn hộ chung cư cho thuê tại ..., diện tích ..., lựa chọn lý tưởng...""

Yêu cầu mô tả (description):
- Là chuỗi nhiều dòng, dùng ký tự xuống dòng \n (không thêm dòng trống thừa).
- Gồm CHÍNH XÁC 4 khối theo thứ tự, giữa các khối chỉ có một ký tự \n:
  1. Đoạn mở đầu 2-3 câu (không dùng tiền tố ""Mô tả:""), mô tả tổng quan, nhấn mạnh trải nghiệm sống/thương mại.
  2. Dòng ""Điểm nổi bật:"" và dòng ngay dưới là đoạn 2-3 câu (không dùng bullet) tóm tắt thông số quan trọng: giá, diện tích, phòng ngủ, phòng tắm, số tầng, hướng, mặt tiền, đường vào, pháp lý.
  3. Dòng ""Khu vực xung quanh:"" và dòng ngay dưới là đoạn 3-5 câu:
     ⚠️ NẾU CÓ DANH SÁCH ĐỊA ĐIỂM: BẮT BUỘC phải nêu TÊN CỤ THỂ, CHÍNH XÁC của ít nhất 3-5 địa điểm từ danh sách đã cung cấp. 
     - CHỈ được copy tên từ danh sách, KHÔNG được tạo tên mới hay viết chung chung
     - Viết tự nhiên, lồng ghép tên địa điểm vào câu văn
     - TUYỆT ĐỐI KHÔNG được sử dụng tên địa điểm nào khác ngoài danh sách
     ⚠️ NẾU KHÔNG CÓ DANH SÁCH: Mô tả tổng quan khu vực dựa trên địa chỉ.
  4. Dòng ""Liên hệ:"" và dòng ngay dưới là câu kêu gọi hành động, ghi rõ tên và số điện thoại thực tế (hoặc hướng dẫn chung nếu thiếu).

Ràng buộc xuất:
{{ ""title"": ""..."", ""description"": ""..."" }}
- Không dùng backtick, không dùng ```json hay chú thích.
- description chỉ là văn bản thuần, giữ nguyên chữ hoa đầu dòng như yêu cầu.";
            var requestBody = new Dictionary<string, object?>
            {
                ["model"] = _model,
                ["messages"] = new[]
                {
                    new { role = "system", content = systemMsg },
                    new { role = "user", content = userContent }
                },
                ["temperature"] = 0.7,
                ["max_tokens"] = _maxTokens
            };

            if (!_isOpenRouter)
            {
                requestBody["response_format"] = new { type = "json_object" };
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl.TrimEnd('/')}/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            
            _logger?.LogInformation($"🚀 Making request to: {_baseUrl.TrimEnd('/')}/chat/completions");
            _logger?.LogInformation($"🔐 Auth header: Bearer {_apiKey[..10]}...");
            
            // Optional headers recommended by OpenRouter
            if (_baseUrl.Contains("openrouter.ai", StringComparison.OrdinalIgnoreCase))
            {
                req.Headers.TryAddWithoutValidation("HTTP-Referer", "http://localhost:5134");
                req.Headers.TryAddWithoutValidation("X-Title", "RealEstateHub AI Listing Generator");
                _logger?.LogInformation("📡 Added OpenRouter headers");
            }
            req.Content = new StringContent(JsonSerializer.Serialize(requestBody, JsonOptions), Encoding.UTF8, "application/json");

            using var res = await _httpClient.SendAsync(req, cancellationToken);
            var content = await res.Content.ReadAsStringAsync(cancellationToken);
            
            _logger?.LogInformation("AI API Response Status: {Status}, Content length: {Length}", res.StatusCode, content?.Length ?? 0);
            
            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogError("AI provider error: {Status} - {Content}", res.StatusCode, content);
                throw new InvalidOperationException($"AI provider error: {(int)res.StatusCode} - {content}");
            }

            // Parse OpenAI chat completions response
            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                string completion = ExtractRawContent(root);
                
                _logger?.LogInformation("Extracted completion length: {Length}, Content preview: {Preview}", 
                    completion?.Length ?? 0, 
                    completion?.Substring(0, Math.Min(200, completion?.Length ?? 0)) ?? "");

                if (string.IsNullOrWhiteSpace(completion))
                {
                    _logger?.LogError("AI response is empty. Full response: {Response}", content);
                    throw new InvalidOperationException("AI response is empty.");
                }

                // Kiểm tra nếu AI từ chối tạo nội dung
                if (IsRejectionResponse(completion))
                {
                    _logger?.LogWarning("AI rejected the request. Attempting retry with adjusted prompt. Original response: {Response}", completion);
                    // Retry với prompt nhẹ nhàng hơn
                    return await RetryWithAdjustedPrompt(dto, cancellationToken);
                }

                var (title, description) = ExtractTitleDescription(completion);
                if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(description))
                {
                    _logger?.LogError("AI response invalid: missing title/description. Completion: {Completion}", completion);
                    throw new InvalidOperationException("AI response invalid: missing title/description.");
                }

                // Validate nearby amenities usage
                if (amenitiesLines.Count > 0)
                {
                    var amenityNames = dto.NearbyAmenities?
                        .Where(a => !string.IsNullOrWhiteSpace(a.Name))
                        .Select(a => a.Name!)
                        .ToList() ?? new List<string>();
                    
                    // Extract "Khu vực xung quanh" section from description
                    var surroundingSection = "";
                    var surroundingIndex = description.IndexOf("Khu vực xung quanh:", StringComparison.OrdinalIgnoreCase);
                    if (surroundingIndex >= 0)
                    {
                        var nextSectionIndex = description.IndexOf("Liên hệ:", surroundingIndex, StringComparison.OrdinalIgnoreCase);
                        if (nextSectionIndex > surroundingIndex)
                        {
                            surroundingSection = description.Substring(surroundingIndex, nextSectionIndex - surroundingIndex);
                        }
                        else
                        {
                            surroundingSection = description.Substring(surroundingIndex);
                        }
                    }
                    
                    var usedCount = amenityNames.Count(name => surroundingSection.Contains(name, StringComparison.OrdinalIgnoreCase));
                    
                    if (usedCount < 3)
                    {
                        _logger?.LogWarning("AI did not use enough specific amenity names in 'Khu vực xung quanh' section. Used: {UsedCount}/3. Retrying...", usedCount);
                        return await RetryWithStrongerAmenityPrompt(dto, amenityNames, cancellationToken);
                    }
                    
                    _logger?.LogInformation("AI used {UsedCount} specific amenity names from the list in 'Khu vực xung quanh' section", usedCount);
                }

                _logger?.LogInformation("Successfully parsed AI response. Title length: {TitleLen}, Description length: {DescLen}", 
                    title?.Length ?? 0, description?.Length ?? 0);
                
                return (title, description);
            }
            catch (JsonException ex)
            {
                _logger?.LogError(ex, "Failed to parse AI response JSON. Content: {Content}", content);
                throw new InvalidOperationException($"Failed to parse AI response: {ex.Message}");
            }
        }

        private static string ExtractRawContent(JsonElement root)
        {
            if (!root.TryGetProperty("choices", out var choicesEl) || choicesEl.ValueKind != JsonValueKind.Array || choicesEl.GetArrayLength() == 0)
            {
                return string.Empty;
            }

            var first = choicesEl[0];

            if (first.TryGetProperty("message", out var messageEl))
            {
                if (messageEl.TryGetProperty("content", out var contentEl))
                {
                    return ExtractFromContentElement(contentEl);
                }

                return messageEl.ToString();
            }

            if (first.TryGetProperty("content", out var directContentEl))
            {
                return ExtractFromContentElement(directContentEl);
            }

            return first.ToString();
        }

        private static string ExtractFromContentElement(JsonElement contentEl)
        {
            switch (contentEl.ValueKind)
            {
                case JsonValueKind.String:
                    return contentEl.GetString() ?? string.Empty;
                case JsonValueKind.Array:
                    var builder = new StringBuilder();
                    foreach (var item in contentEl.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            builder.AppendLine(item.GetString());
                        }
                        else if (item.ValueKind == JsonValueKind.Object && item.TryGetProperty("text", out var textEl) && textEl.ValueKind == JsonValueKind.String)
                        {
                            builder.AppendLine(textEl.GetString());
                        }
                    }
                    return builder.ToString();
                default:
                    return contentEl.ToString();
            }
        }

        private static (string title, string description) ExtractTitleDescription(string completion)
        {
            if (string.IsNullOrWhiteSpace(completion))
            {
                throw new InvalidOperationException("AI response is empty.");
            }

            completion = completion.Trim();

            if (TryParseJsonForTitleDescription(completion, out var parsed))
            {
                return parsed;
            }

            if (completion.Contains("```", StringComparison.Ordinal))
            {
                var segments = completion.Split("```", StringSplitOptions.RemoveEmptyEntries);
                foreach (var seg in segments)
                {
                    var trimmed = seg.Trim();
                    if (trimmed.StartsWith("json", StringComparison.OrdinalIgnoreCase))
                    {
                        trimmed = trimmed[4..].Trim();
                    }
                    if (TryParseJsonForTitleDescription(trimmed, out parsed))
                    {
                        return parsed;
                    }
                }
            }

            var startIdx = completion.IndexOf('{');
            var endIdx = completion.LastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx)
            {
                var jsonCandidate = completion.Substring(startIdx, endIdx - startIdx + 1);
                if (TryParseJsonForTitleDescription(jsonCandidate, out parsed))
                {
                    return parsed;
                }
            }

            // Fallback: try regex-based extraction
            if (TryParseLooseJsonObject(completion, out parsed))
            {
                return parsed;
            }

            // Fallback: attempt to parse line-by-line text
            if (TryParseFromLooseText(completion, out parsed))
            {
                return parsed;
            }

            throw new InvalidOperationException($"Could not extract title/description from AI response: {completion.Substring(0, Math.Min(500, completion.Length))}");
        }

        private static bool TryParseJsonForTitleDescription(string json, out (string title, string description) result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(json))
            {
                return false;
            }

            try
            {
                result = ParseJsonForTitleDescription(json);
                var hasContent = !string.IsNullOrWhiteSpace(result.title) || !string.IsNullOrWhiteSpace(result.description);
                if (!hasContent && TryParseNestedJson(json, out var nested))
                {
                    result = nested;
                    hasContent = !string.IsNullOrWhiteSpace(result.title) || !string.IsNullOrWhiteSpace(result.description);
                }
                return hasContent;
            }
            catch (JsonException)
            {
                return TryParseNestedJson(json, out result);
            }
        }

        private static (string title, string description) ParseJsonForTitleDescription(string json)
        {
            using var outDoc = JsonDocument.Parse(json);
            var outRoot = outDoc.RootElement;
            var title = outRoot.TryGetProperty("title", out var tEl) ? (tEl.GetString() ?? string.Empty) : string.Empty;
            var description = outRoot.TryGetProperty("description", out var dEl) ? (dEl.GetString() ?? string.Empty) : string.Empty;
            return NormalizeTitleDescription(title, description);
        }

        private static (string title, string description) NormalizeTitleDescription(string title, string description)
        {
            var cleanedTitle = (title ?? string.Empty).Trim();
            var cleanedDescription = (description ?? string.Empty).Trim();

            if (IsNestedJsonCandidate(cleanedTitle) && TryParseNestedJson(cleanedTitle, out var nestedTitleDesc))
            {
                cleanedTitle = nestedTitleDesc.title.Trim();
                if (!string.IsNullOrWhiteSpace(nestedTitleDesc.description))
                {
                    cleanedDescription = nestedTitleDesc.description.Trim();
                }
            }

            if (IsNestedJsonCandidate(cleanedDescription) && TryParseNestedJson(cleanedDescription, out var nestedDesc))
            {
                if (string.IsNullOrWhiteSpace(cleanedTitle))
                {
                    cleanedTitle = nestedDesc.title.Trim();
                }
                if (!string.IsNullOrWhiteSpace(nestedDesc.description))
                {
                    cleanedDescription = nestedDesc.description.Trim();
                }
            }

            // Unescape các ký tự đặc biệt để hiển thị đúng xuống dòng
            cleanedTitle = UnescapeString(cleanedTitle);
            cleanedDescription = UnescapeString(cleanedDescription);

            return (cleanedTitle, cleanedDescription);
        }

        private static string UnescapeString(string value)
        {
            if (string.IsNullOrEmpty(value))
                return value;

            return value
                .Replace("\\n", "\n")
                .Replace("\\r", "\r")
                .Replace("\\t", "\t")
                .Replace("\\\"", "\"")
                .Replace("\\\\", "\\");
        }

        private static bool IsNestedJsonCandidate(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            var trimmed = value.Trim();
            if (trimmed is "{" or "}" or "{{" or "}}")
            {
                return true;
            }

            return trimmed.StartsWith("{") || trimmed.StartsWith("\"{") || trimmed.Contains("\"title\"");
        }

        private static bool TryParseNestedJson(string value, out (string title, string description) result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            var candidate = value.Trim();
            if (candidate.StartsWith("\"") && candidate.EndsWith("\""))
            {
                candidate = candidate.Trim('"');
            }

            candidate = candidate.Replace("\\\"", "\"").Replace("\\n", "\n").Replace("\\r", "\r").Trim();

            if (!candidate.StartsWith("{") || !candidate.EndsWith("}"))
            {
                return false;
            }

            try
            {
                using var doc = JsonDocument.Parse(candidate);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                {
                    return false;
                }

                var title = root.TryGetProperty("title", out var tEl) ? (tEl.GetString() ?? string.Empty) : string.Empty;
                var description = root.TryGetProperty("description", out var dEl) ? (dEl.GetString() ?? string.Empty) : string.Empty;
                result = NormalizeTitleDescription(title, description);
                return !string.IsNullOrWhiteSpace(result.title) || !string.IsNullOrWhiteSpace(result.description);
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static bool TryParseLooseJsonObject(string completion, out (string title, string description) result)
        {
            result = default;
            var options = RegexOptions.Singleline | RegexOptions.IgnoreCase;
            var titleMatch = Regex.Match(completion, "\"title\"\\s*:\\s*\"(.*?)\"", options);
            var descMatch = Regex.Match(completion, "\"description\"\\s*:\\s*\"(.*?)\"", options);

            if (!titleMatch.Success && !descMatch.Success)
            {
                return false;
            }

            var title = titleMatch.Success ? titleMatch.Groups[1].Value : string.Empty;
            var description = descMatch.Success ? descMatch.Groups[1].Value : string.Empty;

            title = UnescapeLooseString(title);
            description = UnescapeLooseString(description);

            result = NormalizeTitleDescription(title, description);
            return !string.IsNullOrWhiteSpace(result.title) || !string.IsNullOrWhiteSpace(result.description);
        }

        private static bool TryParseFromLooseText(string completion, out (string title, string description) result)
        {
            result = default;
            var lines = completion
                .Replace("\r", string.Empty)
                .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim())
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .ToList();

            if (lines.Count == 0)
            {
                return false;
            }

            string title = string.Empty;
            var descriptionBuilder = new StringBuilder();
            var capturingDescription = false;

            foreach (var line in lines)
            {
                if (!capturingDescription &&
                    (line.StartsWith("\"title\"", StringComparison.OrdinalIgnoreCase) ||
                     line.StartsWith("title", StringComparison.OrdinalIgnoreCase)))
                {
                    var idx = line.IndexOf(':');
                    if (idx >= 0)
                    {
                        var value = line[(idx + 1)..].Trim().Trim('"', ',', '{', '}');
                        if (!string.IsNullOrWhiteSpace(value))
                        {
                            title = value;
                        }
                    }
                    continue;
                }

                if (!capturingDescription &&
                    (line.StartsWith("\"description\"", StringComparison.OrdinalIgnoreCase) ||
                     line.StartsWith("description", StringComparison.OrdinalIgnoreCase)))
                {
                    capturingDescription = true;
                    var idx = line.IndexOf(':');
                    if (idx >= 0 && idx < line.Length - 1)
                    {
                        var tail = line[(idx + 1)..].Trim().Trim('"', ',', '{', '}');
                        if (!string.IsNullOrEmpty(tail))
                        {
                            descriptionBuilder.AppendLine(tail);
                        }
                    }
                    continue;
                }

                if (capturingDescription)
                {
                    if (line.StartsWith("\"") && line.Contains("\":"))
                    {
                        // Next field reached
                        capturingDescription = false;
                    }
                    else
                    {
                        descriptionBuilder.AppendLine(line.Trim('"'));
                    }
                }
            }

            var description = descriptionBuilder.ToString().Trim();
            if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(description))
            {
                return false;
            }

            result = (title.Trim(), description);
            return true;
        }

        private static string UnescapeLooseString(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }

            return value
                .Replace("\\\"", "\"")
                .Replace("\\\\", "\\")
                .Replace("\\n", "\n")
                .Replace("\\r", "\r")
                .Replace("\\t", "\t")
                .Trim();
        }

        private static bool IsRejectionResponse(string completion)
        {
            if (string.IsNullOrWhiteSpace(completion))
            {
                return false;
            }

            var lower = completion.ToLowerInvariant();
            var rejectionKeywords = new[]
            {
                "không thể tạo",
                "không thể",
                "từ chối",
                "xin lỗi",
                "không thể tạo ra",
                "cannot create",
                "cannot generate",
                "i cannot",
                "i'm sorry",
                "i apologize",
                "refuse",
                "decline"
            };

            // Kiểm tra nếu có từ khóa từ chối VÀ không có JSON hợp lệ
            var hasRejectionKeyword = rejectionKeywords.Any(keyword => lower.Contains(keyword));
            if (!hasRejectionKeyword)
            {
                return false;
            }

            // Nếu có từ khóa từ chối nhưng không có JSON, có thể là từ chối
            var hasJson = completion.Contains("{") && completion.Contains("title") && completion.Contains("description");
            return !hasJson;
        }

        private async Task<(string title, string description)> RetryWithAdjustedPrompt(AiGenerateListingDto dto, CancellationToken cancellationToken)
        {
            // Prompt nhẹ nhàng hơn, tập trung vào việc mô tả thông tin thực tế
            var systemMsg = @"Bạn là trợ lý viết mô tả cho tin đăng bất động sản. Nhiệm vụ của bạn là tạo mô tả dựa trên thông tin được cung cấp.

Đây là một công việc hợp pháp: giúp người dùng viết mô tả cho tài sản của họ. Bạn chỉ cần mô tả thông tin thực tế được cung cấp, không tạo ra thông tin giả mạo.

⚠️ QUY TẮC BẮT BUỘC:
- Luôn trả về JSON với format: {""title"": ""..."", ""description"": ""...""}
- Khi có danh sách địa điểm xung quanh:
  ✓ BẮT BUỘC sử dụng TÊN CHÍNH XÁC từ danh sách
  ✓ KHÔNG được tạo tên mới hay viết chung chung
  ✓ PHẢI nêu tên cụ thể ít nhất 3-5 địa điểm";

            // Giữ nguyên phần amenities và contact
            var amenitiesLines = dto.NearbyAmenities?
                .Where(a => !string.IsNullOrWhiteSpace(a.Name))
                .OrderBy(a => a.DistanceMeters ?? double.MaxValue)
                .Take(10)
                .Select(a =>
                {
                    var distanceText = a.DistanceMeters.HasValue
                        ? $"~{Math.Round(a.DistanceMeters.Value / 1000) * 1000} m"
                        : "gần đó";
                    var category = string.IsNullOrWhiteSpace(a.Category) ? "Địa điểm" : a.Category;
                    return $"• {a.Name} ({category}, {distanceText})";
                })
                .ToList() ?? new List<string>();

            var amenitiesSection = amenitiesLines.Count > 0
                ? $@"===== DANH SÁCH ĐỊA ĐIỂM XUNG QUANH (BẮT BUỘC SỬ DỤNG) =====
{string.Join("\n", amenitiesLines)}
===== KẾT THÚC DANH SÁCH =====

⚠️ QUY TẮC: Trong phần 'Khu vực xung quanh', BẮT BUỘC phải nêu TÊN CỤ THỂ, CHÍNH XÁC của ít nhất 3-5 địa điểm từ danh sách trên. CHỈ được copy tên từ danh sách, KHÔNG được tạo tên mới hay viết chung chung."
                : "Không có dữ liệu địa điểm cụ thể.";

            var contactInstruction = !string.IsNullOrWhiteSpace(dto.UserName) || !string.IsNullOrWhiteSpace(dto.UserPhone)
                ? $"Thông tin liên hệ: {dto.UserName ?? "N/A"} - {dto.UserPhone ?? "N/A"}"
                : "Không có thông tin liên hệ.";

            var userContent = $@"Hãy tạo tiêu đề và mô tả cho tin đăng bất động sản với thông tin sau:

Loại: {dto.Category ?? "N/A"}
Nhu cầu: {(dto.TransactionType == "Rent" ? "Cho thuê" : "Bán")}
Địa chỉ: {dto.Address ?? "N/A"}
Giá: {(dto.Price ?? 0).ToString("0.##")} {(dto.PriceUnit == 0 ? "tỷ" : "triệu")} VNĐ
Diện tích: {(dto.AreaSize ?? 0).ToString("0.##")} m²
Phòng ngủ: {dto.Bedrooms ?? 0}
Phòng tắm: {dto.Bathrooms ?? 0}
Tầng: {dto.Floors ?? 0}
Hướng: {dto.Direction ?? "N/A"}
Pháp lý: {dto.Legal ?? "N/A"}

{amenitiesSection}

{contactInstruction}

Yêu cầu:
- Tiêu đề: 110-130 ký tự, hấp dẫn
- Mô tả: 4 phần (mở đầu, Điểm nổi bật, Khu vực xung quanh với tên địa điểm cụ thể, Liên hệ)
- Trả về JSON: {{""title"": ""..."", ""description"": ""...""}}";

            var requestBody = new Dictionary<string, object?>
            {
                ["model"] = _model,
                ["messages"] = new[]
                {
                    new { role = "system", content = systemMsg },
                    new { role = "user", content = userContent }
                },
                ["temperature"] = 0.8, // Tăng temperature một chút
                ["max_tokens"] = _maxTokens
            };

            if (!_isOpenRouter)
            {
                requestBody["response_format"] = new { type = "json_object" };
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl.TrimEnd('/')}/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            if (_baseUrl.Contains("openrouter.ai", StringComparison.OrdinalIgnoreCase))
            {
                req.Headers.TryAddWithoutValidation("HTTP-Referer", "http://localhost:5134");
                req.Headers.TryAddWithoutValidation("X-Title", "RealEstateHub AI Listing Generator");
            }
            req.Content = new StringContent(JsonSerializer.Serialize(requestBody, JsonOptions), Encoding.UTF8, "application/json");

            using var res = await _httpClient.SendAsync(req, cancellationToken);
            var content = await res.Content.ReadAsStringAsync(cancellationToken);

            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogError("Retry failed: {Status} - {Content}", res.StatusCode, content);
                throw new InvalidOperationException($"AI service error after retry: {(int)res.StatusCode}");
            }

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;
            var completion = ExtractRawContent(root);

            if (string.IsNullOrWhiteSpace(completion))
            {
                throw new InvalidOperationException("AI response is empty after retry.");
            }

            var (title, description) = ExtractTitleDescription(completion);
            if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(description))
            {
                throw new InvalidOperationException("AI response invalid after retry: missing title/description.");
            }

            return (title, description);
        }

        private async Task<(string title, string description)> RetryWithStrongerAmenityPrompt(AiGenerateListingDto dto, List<string> amenityNames, CancellationToken cancellationToken)
        {
            _logger?.LogInformation("Retrying with stronger amenity prompt...");

            var systemMsg = @"Bạn là chuyên gia marketing bất động sản. Nhiệm vụ của bạn là tạo mô tả tin đăng dựa trên thông tin thực tế.

🚨 CẢNH BÁO: Response trước đã BỊ TỪ CHỐI vì KHÔNG tuân thủ quy tắc về địa điểm xung quanh.

⚠️ QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM):
- Luôn trả về JSON: {""title"": ""..."", ""description"": ""...""}
- Trong phần 'Khu vực xung quanh' của description:
  ✓ BẮT BUỘC phải copy CHÍNH XÁC tên của ít nhất 3-5 địa điểm từ danh sách
  ✓ TUYỆT ĐỐI KHÔNG được tạo tên mới
  ✓ TUYỆT ĐỐI KHÔNG được viết chung chung như 'có bệnh viện, siêu thị'
  ✓ Phải viết: 'Gần [TÊN CHÍNH XÁC TỪ DANH SÁCH] và [TÊN CHÍNH XÁC TỪ DANH SÁCH]...'";

            var amenitiesLines = dto.NearbyAmenities?
                .Where(a => !string.IsNullOrWhiteSpace(a.Name))
                .OrderBy(a => a.DistanceMeters ?? double.MaxValue)
                .Take(10)
                .Select(a =>
                {
                    var distanceText = a.DistanceMeters.HasValue
                        ? $"~{Math.Round(a.DistanceMeters.Value / 1000) * 1000} m"
                        : "gần đó";
                    var category = string.IsNullOrWhiteSpace(a.Category) ? "Địa điểm" : a.Category;
                    return $"• {a.Name} ({category}, {distanceText})";
                })
                .ToList() ?? new List<string>();

            var userContent = $@"🚨 LẦN THỬ CUỐI CÙNG - PHẢI TUÂN THỦ QUY TẮC 🚨

Dữ liệu bất động sản:
- Loại: {dto.Category ?? "N/A"}
- Nhu cầu: {(dto.TransactionType == "Rent" ? "Cho thuê" : "Bán")}
- Địa chỉ: {dto.Address ?? "N/A"}
- Giá: {(dto.Price ?? 0).ToString("0.##")} {(dto.PriceUnit == 0 ? "tỷ" : "triệu")} VNĐ
- Diện tích: {(dto.AreaSize ?? 0).ToString("0.##")} m²
- Phòng ngủ: {dto.Bedrooms ?? 0}, Phòng tắm: {dto.Bathrooms ?? 0}
- Tầng: {dto.Floors ?? 0}, Hướng: {dto.Direction ?? "N/A"}

===== DANH SÁCH ĐỊA ĐIỂM - CHỈ ĐƯỢC DÙNG TÊN TỪ DANH SÁCH NÀY =====
{string.Join("\n", amenitiesLines)}
===== KẾT THÚC DANH SÁCH =====

⚠️ YÊU CẦU CHẶT CHẼ:
1. Tiêu đề: 110-130 ký tự, hấp dẫn
2. Mô tả gồm 4 phần:
   - Mở đầu (2-3 câu)
   - Điểm nổi bật: (2-3 câu về thông số)
   - Khu vực xung quanh: 🚨 BẮT BUỘC phải nêu TÊN CHÍNH XÁC của ít nhất 3-5 địa điểm từ danh sách trên
     🚨 CHỈ được sử dụng tên có trong danh sách, KHÔNG được tạo tên mới
     🚨 Viết tự nhiên nhưng PHẢI dùng tên chính xác từ danh sách
   - Liên hệ: {dto.UserName ?? "N/A"} - {dto.UserPhone ?? "N/A"}

Trả về JSON: {{""title"": ""..."", ""description"": ""...""}}";

            var requestBody = new Dictionary<string, object?>
            {
                ["model"] = _model,
                ["messages"] = new[]
                {
                    new { role = "system", content = systemMsg },
                    new { role = "user", content = userContent }
                },
                ["temperature"] = 0.5, // Giảm temperature để AI tuân thủ hơn
                ["max_tokens"] = _maxTokens
            };

            if (!_isOpenRouter)
            {
                requestBody["response_format"] = new { type = "json_object" };
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl.TrimEnd('/')}/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            if (_baseUrl.Contains("openrouter.ai", StringComparison.OrdinalIgnoreCase))
            {
                req.Headers.TryAddWithoutValidation("HTTP-Referer", "http://localhost:5134");
                req.Headers.TryAddWithoutValidation("X-Title", "RealEstateHub AI Listing Generator");
            }
            req.Content = new StringContent(JsonSerializer.Serialize(requestBody, JsonOptions), Encoding.UTF8, "application/json");

            using var res = await _httpClient.SendAsync(req, cancellationToken);
            var content = await res.Content.ReadAsStringAsync(cancellationToken);

            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogError("Retry with stronger prompt failed: {Status} - {Content}", res.StatusCode, content);
                throw new InvalidOperationException($"AI service error after retry: {(int)res.StatusCode}");
            }

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;
            var completion = ExtractRawContent(root);

            if (string.IsNullOrWhiteSpace(completion))
            {
                throw new InvalidOperationException("AI response is empty after retry.");
            }

            var (title, description) = ExtractTitleDescription(completion);
            if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(description))
            {
                throw new InvalidOperationException("AI response invalid after retry: missing title/description.");
            }

            // Log final validation
            var usedCount = amenityNames.Count(name => description.Contains(name, StringComparison.OrdinalIgnoreCase));
            _logger?.LogInformation("After retry: AI used {UsedCount} specific amenity names", usedCount);

            return (title, description);
        }
    }
}

