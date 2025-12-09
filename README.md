## RealEstateHub

A full-stack real estate platform with a .NET 9 (ASP.NET Core) backend API and a React (Vite) frontend. It supports user authentication, membership upgrades, agent profile creation, listing management, chat (SignalR + Stream), notifications, and online payments via VNPay and MoMo.

### Monorepo Layout
- `api/`: ASP.NET Core 9 Web API (Entity Framework Core + SQL Server)
- `client/`: React 19 + Vite 6 app (Ant Design, MUI, React Router v7)

### Key Features
- User auth (JWT)
- Membership subscriptions (monthly/quarterly/yearly)
- Agent profile creation flow with preview caching and file moves
- Listing/posts, categories, areas
- **360° Panorama Tours** - Interactive 3D virtual tours with hotspot navigation
- **AI-Powered Content Generation** - Automatic title and description creation using OpenAI
- Favorites, compares, reports
- Real-time chat (SignalR/WebSocket) + optional Stream Chat
- Notifications (payment success, membership upgrade, agent profile created)
- Payments: VNPay and MoMo (sandbox ready)

---

## Tech Stack

### Backend (api/)
- .NET 9 (ASP.NET Core)
- Entity Framework Core 9 + SQL Server
- JWT Authentication
- SignalR (real-time messaging)
- Swagger (OpenAPI)

### Frontend (client/)
- React 19 + Vite 6
- Ant Design 5, MUI 7
- React Router v7
- Axios
- TailwindCSS (configured)

---

## Prerequisites
- Node.js >= 18 (recommended 20+)
- .NET SDK 9.0+
- SQL Server (Developer/Express) or a SQL Server-compatible instance

Optional (local tooling):
- EF Core CLI: `dotnet tool install --global dotnet-ef`

---

## Getting Started

### 1) Backend (API)

1. Configure `api/appsettings.Development.json` or `api/appsettings.json`
   - Connection string
   - JWT
   - VNPay/MoMo sandbox keys
   - Return/Notify URLs for payments

   Example (excerpts):
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;Trusted_Connection=True;TrustServerCertificate=True"
     },
     "Jwt": {
       "Key": "YOUR_SECRET",
       "Issuer": "http://localhost:5134",
       "Audience": "http://localhost:5134",
       "ExpiryInMinutes": 100000
     },
     "Vnpay": {
       "TmnCode": "RQQQIMY3",
       "HashSecret": "AKU3P57EM0H5VHB4XPOX2RG9FKWWX3G6",
       "BaseUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
       "Command": "pay",
       "CurrCode": "VND",
       "Version": "2.1.0",
       "Locale": "vn",
       "IpnUrl": "http://localhost:5134/api/payment/vnpay-ipn"
     },
     "PaymentCallBack": {
       "ReturnUrl": "http://localhost:5173/Checkout/PaymentCallbackVnpay"
     },
     "MomoAPI": {
       "MomoApiUrl": "https://test-payment.momo.vn/gw_payment/transactionProcessor",
       "SecretKey": "...",
       "AccessKey": "...",
       "ReturnUrl": "http://localhost:5173/Checkout/PaymentCallbackVnpay",
       "NotifyUrl": "http://localhost:5134/api/payment/momo-notify",
       "PartnerCode": "MOMO",
       "RequestType": "captureMoMoWallet"
     },
     "TimeZoneId": "SE Asia Standard Time"
   }
   ```

2. Apply migrations and run the API:
   ```bash
   # from repo root
   dotnet restore
   dotnet build
   # optional (if DB not created):
   dotnet ef database update --project api/RealEstateHubAPI.csproj

   # run API (default Kestrel port varies; sample config points to 5134)
   dotnet run --project api/RealEstateHubAPI.csproj
   ```

3. API base URL (dev): `http://localhost:5134`

Swagger is available if enabled (Swashbuckle): `http://localhost:5134/swagger`.

### 2) Frontend (Client)

```bash
cd client
npm install
npm run dev
```

Dev server: `http://localhost:5173`

Ensure the API base URL is correctly set in client Axios utilities (`client/src/api/axiosClient.js` / `axiosPrivate.js`).

---

## 360° Panorama Tours (3D View)

This platform features a fully custom-built 360° panorama tour system using Three.js, allowing users to create immersive virtual property tours.

### Features
- **Multi-Scene Tours**: Upload multiple panorama images to create connected virtual tours
- **Hotspot Navigation**: Add interactive hotspots to link between different rooms/areas
- **Drag & Drop Editor**: Intuitive editor to position hotspots in 3D space
- **Real-time Preview**: Preview tours before publishing
- **Mouse/Touch Controls**: Smooth pan, zoom, and rotation controls
- **Little Planet Intro**: Optional animated intro effect for engaging user experience

### How It Works

#### 1. Creating a Panorama Tour

When creating a post, users can choose between regular images or panorama mode:

```javascript
// In CreatePostWizard.jsx
<Segmented
  options={[
    { label: 'Ảnh thường', value: 'regular' },
    { label: 'Panorama 360°', value: 'panorama' }
  ]}
  onChange={(value) => setUploadMode(value)}
/>
```

#### 2. Panorama Editor

The `PanoramaTourEditor` component provides a full-screen editor:

- **Upload Multiple Images**: Add multiple 360° panorama images
- **Scene Management**: View thumbnails and switch between scenes
- **Hotspot Creation**: Click "Thêm Hotspot" to add navigation points
- **Hotspot Positioning**: Drag hotspots in 3D space to desired locations
- **Target Scene Selection**: Choose which scene each hotspot links to
- **Edit/Navigate Modes**: Toggle between editing hotspots and testing navigation

```javascript
// Hotspot data structure
{
  id: "hotspot-123",
  yaw: 45,        // Horizontal angle in degrees
  pitch: 0,       // Vertical angle in degrees
  targetSceneId: "scene-456"  // Destination scene
}
```

#### 3. 3D Viewer

The `CustomImageTourViewer` component renders tours using Three.js:

**Technical Implementation:**
- Creates a sphere geometry (radius 500 units)
- Maps panorama texture onto the sphere using `EquirectangularReflectionMapping`
- Inverts sphere to view from inside (`geometry.scale(1, 1, -1)`)
- Projects hotspots from 3D coordinates to 2D screen space
- Handles mouse/touch events for rotation and zoom

**Controls:**
- **Mouse Drag**: Rotate view (horizontal and vertical)
- **Mouse Wheel**: Zoom in/out (FOV 70-140°)
- **Touch**: Pan and pinch-to-zoom on mobile
- **Hotspot Click**: Navigate to linked scene

**Performance Optimizations:**
- Memoized scene data to prevent unnecessary re-renders
- Efficient raycasting for hotspot interactions
- Texture disposal on scene changes to prevent memory leaks

#### 4. Data Storage

Panorama tour configuration is stored as JSON in the database:

```json
{
  "scenes": [
    {
      "id": "scene-1",
      "name": "Phòng khách",
      "description": "Phòng khách rộng rãi, thoáng mát",
      "imageUrl": "/uploads/panorama/abc123.jpg",
      "panoramaUrl": "/uploads/panorama/abc123.jpg",
      "thumbUrl": "/uploads/panorama/thumb_abc123.jpg",
      "hotspots": [
        {
          "id": "hotspot-1",
          "yaw": 45,
          "pitch": 0,
          "targetSceneId": "scene-2"
        }
      ]
    },
    {
      "id": "scene-2",
      "name": "Phòng ngủ",
      "imageUrl": "/uploads/panorama/def456.jpg",
      "hotspots": []
    }
  ],
  "startupSceneIndex": 0
}
```

#### 5. Backend Support

**File Upload Configuration:**
```csharp
// Program.cs - Increased limits for large panorama files
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 524288000; // 500 MB
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 524288000; // 500 MB
});
```

**Post Model:**
```csharp
public class Post
{
    // ... other properties
    public string? PanoramaTourConfig { get; set; }  // JSON string
}
```

### Usage Example

```jsx
// Display panorama tour in PostDetail page
{post.panoramaTourConfig && (
  <CustomImageTourViewer
    scenes={JSON.parse(post.panoramaTourConfig).scenes}
    initialSceneId={scenes[0]?.id}
    height={600}
    controls={true}
    showThumbs={true}
    fov={120}
    fovMin={70}
    fovMax={140}
    autoRotate={false}
    littlePlanetIntro={true}
  />
)}
```

---

## AI-Powered Content Generation

The platform integrates OpenAI's GPT models to automatically generate compelling property listings, saving time and improving content quality.

### Features
- **Smart Title Generation**: Creates attention-grabbing titles based on property details
- **Detailed Descriptions**: Generates comprehensive property descriptions
- **Tone Selection**: Choose between formal ("Lịch sự") or casual ("Trẻ trung") tone
- **Context-Aware**: Uses property attributes (location, price, size, amenities) for accurate content
- **Editable Output**: Generated content can be edited before posting

### How It Works

#### 1. User Interface

In the `CreatePostWizard` (Step 4: Title & Description), users can click the AI button:

```jsx
<Button
  type="primary"
  icon={<RobotOutlined />}
  onClick={() => setAiVisible(true)}
>
  Tạo bằng AI
</Button>
```

#### 2. Data Collection

The system collects all relevant property information:

```javascript
const buildAiSourceData = () => {
  return {
    category: "Nhà riêng",           // Property type
    transactionType: "Sale",          // Sale or Rent
    address: "123 Nguyễn Huệ, Q1, TP.HCM",
    price: 5.5,
    priceUnit: "Tỷ",
    areaSize: 120,                    // m²
    bedrooms: 3,
    bathrooms: 2,
    floors: 2,
    direction: "Đông",                // Facing direction
    balcony: "Đông Nam",
    frontage: 6,                      // meters
    alley: 4,                         // meters
    legal: "Sổ hồng",                 // Legal status
    username: "Nguyễn Văn A",
    userphone: "0901234567"
  };
};
```

#### 3. API Request

Frontend sends data to backend AI endpoint:

```javascript
const handleGenerateAI = async () => {
  const response = await axiosPrivate.post('/api/ai/generate-listing', {
    ...data,
    tone: aiTone  // "Lịch sự" or "Trẻ trung"
  });
  
  setAiTitle(response.data.title);
  setAiDescription(response.data.description);
};
```

#### 4. Backend Processing

**AiController.cs:**
```csharp
[HttpPost("generate-listing")]
public async Task<IActionResult> GenerateListing([FromBody] AiGenerateListingDto dto)
{
    var result = await _aiTextService.GenerateListingContentAsync(dto);
    return Ok(result);
}
```

**OpenAiTextService.cs:**
```csharp
public async Task<AiGeneratedContent> GenerateListingContentAsync(AiGenerateListingDto dto)
{
    // Build detailed prompt with property information
    var prompt = BuildPrompt(dto);
    
    // Call OpenAI API
    var response = await _httpClient.PostAsync(
        "https://api.openai.com/v1/chat/completions",
        new StringContent(JsonSerializer.Serialize(new {
            model = "gpt-4",
            messages = new[] {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = prompt }
            },
            temperature = 0.7
        }))
    );
    
    // Parse and return result
    return new AiGeneratedContent {
        Title = extractedTitle,
        Description = extractedDescription
    };
}
```

#### 5. Prompt Engineering

The system uses carefully crafted prompts to generate high-quality content:

**System Prompt:**
```
Bạn là một chuyên gia bất động sản chuyên nghiệp tại Việt Nam. 
Nhiệm vụ của bạn là tạo tiêu đề và mô tả hấp dẫn cho tin đăng bất động sản.
```

**User Prompt Example:**
```
Tạo tiêu đề và mô tả cho bất động sản sau:
- Loại: Nhà riêng
- Giao dịch: Bán
- Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM
- Giá: 5.5 Tỷ VNĐ
- Diện tích: 120 m²
- Phòng ngủ: 3
- Phòng tắm: 2
- Số tầng: 2
- Hướng nhà: Đông
- Mặt tiền: 6m
- Pháp lý: Sổ hồng

Tone: Lịch sự (formal)

Yêu cầu:
- Tiêu đề: Ngắn gọn, hấp dẫn, dưới 100 ký tự
- Mô tả: Chi tiết, chuyên nghiệp, 200-300 từ
- Làm nổi bật ưu điểm của bất động sản
- Bao gồm thông tin liên hệ
```

#### 6. Response Format

```json
{
  "title": "Bán Nhà Riêng Mặt Tiền Nguyễn Huệ Q1 - 120m² - Sổ Hồng - 5.5 Tỷ",
  "description": "🏡 BÁN NHÀ RIÊNG MẶT TIỀN NGUYỄN HUỆ - QUẬN 1\n\n📍 Vị trí: 123 Nguyễn Huệ, Quận 1, TP.HCM\n💰 Giá: 5.5 Tỷ VNĐ\n📐 Diện tích: 120 m²\n\n✨ THÔNG TIN CHI TIẾT:\n- Phòng ngủ: 3 phòng\n- Phòng tắm: 2 phòng\n- Số tầng: 2 tầng\n- Hướng nhà: Đông\n- Mặt tiền: 6m\n- Pháp lý: Sổ hồng đầy đủ\n\n🌟 ƯU ĐIỂM NỔI BẬT:\n- Vị trí đắc địa tại trung tâm Quận 1\n- Mặt tiền rộng 6m, thuận tiện kinh doanh\n- Thiết kế 2 tầng hiện đại, thoáng mát\n- Hướng Đông đón ánh sáng tự nhiên\n- Sổ hồng chính chủ, pháp lý rõ ràng\n\n📞 Liên hệ: Nguyễn Văn A - 0901234567"
}
```

#### 7. User Review & Edit

Users can:
- Preview generated content in a modal
- Edit title and description if needed
- Apply to form with one click
- Regenerate with different tone

```jsx
<Modal
  title="Nội dung được tạo bởi AI"
  open={aiVisible}
  onOk={applyAiResult}
  onCancel={() => setAiVisible(false)}
>
  <Radio.Group value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
    <Radio value="Lịch sự">Lịch sự</Radio>
    <Radio value="Trẻ trung">Trẻ trung</Radio>
  </Radio.Group>
  
  <Input value={aiTitle} onChange={(e) => setAiTitle(e.target.value)} />
  <TextArea value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} />
  
  <Button onClick={handleGenerateAI} loading={aiLoading}>
    Tạo lại
  </Button>
</Modal>
```

### Configuration

**appsettings.json:**
```json
{
  "OpenAI": {
    "ApiKey": "sk-...",
    "Model": "gpt-4",
    "MaxTokens": 1000,
    "Temperature": 0.7
  }
}
```

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-...
```

### Benefits

1. **Time Saving**: Generate content in seconds instead of minutes
2. **Consistency**: Maintain professional tone across all listings
3. **SEO Optimization**: AI naturally includes relevant keywords
4. **Multilingual**: Can be adapted for multiple languages
5. **Customization**: Tone selection allows brand voice flexibility

### Error Handling

```csharp
try {
    var result = await _aiTextService.GenerateListingContentAsync(dto);
    return Ok(result);
}
catch (HttpRequestException ex) {
    return StatusCode(503, "AI service temporarily unavailable");
}
catch (Exception ex) {
    _logger.LogError(ex, "Error generating AI content");
    return StatusCode(500, "Failed to generate content");
}
```

---

## Payments

This project supports VNPay and MoMo. VNPay is the primary flow; MoMo is implemented similarly.

### VNPay Flow (High-level)
1. Frontend builds a payload and calls `POST /api/payment/vnpay/create`.
2. Backend creates a signed VNPay URL and returns it.
3. Frontend redirects the user to VNPay.
4. After payment, VNPay redirects to Frontend Return URL; Frontend calls `GET /api/payment/vnpay-return` with the full query to validate on the server.
5. IPN (`POST /api/payment/vnpay-ipn`) is also processed server-to-server for reliability.
6. On success, the server processes membership upgrades and/or commits agent profiles, saves `PaymentHistory`, and returns a JSON with details (including `agentProfileId` when relevant).

### Key Backend Files
- `api/Controllers/PaymentController.cs`
  - `POST /api/payment/vnpay/create`: returns `{ url }` to redirect
  - `GET /api/payment/vnpay-return`: validates response, triggers business processing, returns `PaymentResponseModel`
  - `POST /api/payment/vnpay-ipn`: server-to-server confirmation
- `api/Services/VNPayService.cs`
  - Creates VNPay request URL and validates response via `VnPayLibrary`
- `api/Libraries/VnPayLibrary.cs`
  - Builds `vnp_*` query, signs HMAC-SHA512, and validates the response signature
- `api/Services/PaymentProcessingService.cs`
  - Parses `orderInfo` (e.g., `userId=1;plan=pro_month;previewId=GUID;type=agent_profile`)
  - Upgrades user to Membership (plan-aware), commits Agent Profile (using preview cache), saves `PaymentHistory`, creates notifications, and returns `agentProfileId`
- `api/Models/PaymentResponseModel.cs`
  - Includes `Success`, `VnPayResponseCode`, `OrderInfo`, and `AgentProfileId`

### Frontend Files
- `client/src/pages/Checkout/MembershipCheckoutPage.jsx`
- `client/src/pages/Checkout/AgentProfileCheckoutPage.jsx`
- `client/src/pages/Checkout/PaymentCallbackVnpay.jsx`

### Example Payload (VNPay Create)
```json
{
  "name": "User",
  "orderDescription": "userId=123;plan=pro_month;type=membership",
  "amount": 199000,
  "orderType": "membership",
  "userId": 123
}
```

### Success Handling
- Backend sets `Success=true` and `VnPayResponseCode="00"` when valid.
- For agent profile payments, response may include `agentProfileId` for direct navigation: `/agent-profile/{id}`.
- Frontend refreshes user context to reflect updated role after success.

---

## Agent Profile Commit Flow
1. Frontend prepares an Agent Profile (preview) and stores data in cache (server side) keyed by `previewId`.
2. Payment payload includes `previewId` and `type=agent_profile`.
3. After payment success, server commits the preview:
   - Moves files from `/uploads/temp/...` to `/uploads/avatars|banners/...`
   - Creates `AgentProfile` via service
   - Removes preview cache
   - Returns `agentProfileId` in `PaymentResponseModel`

---

## Chat & Notifications
- Real-time chat via SignalR (`ChatHub`, `ChatController`) and optional Stream Chat SDK.
- Notifications are persisted for key events (payment success, membership upgrade, agent profile created).

---

## Environment & Configuration

Important values to confirm per environment:
- API base URL (Kestrel)
- Frontend dev/prod URL
- VNPay: `TmnCode`, `HashSecret`, `BaseUrl`, `IpnUrl`
- MoMo: `AccessKey`, `SecretKey`, `PartnerCode`, `ReturnUrl`, `NotifyUrl`
- `PaymentCallBack.ReturnUrl`: must point to the Frontend callback route
- `TimeZoneId`: e.g., `SE Asia Standard Time`

Security notes:
- Always validate gateway signatures (already implemented in `VnPayLibrary.ValidateSignature`).
- Prefer HTTPS for all public endpoints and callbacks in production.

---

## Database
- EF Core Migrations are included under `api/Migrations/`.
- Apply with `dotnet ef database update --project api/RealEstateHubAPI.csproj`.

---

## Scripts & Commands

Backend:
```bash
dotnet restore
dotnet build
dotnet ef database update --project api/RealEstateHubAPI.csproj
dotnet run --project api/RealEstateHubAPI.csproj
```

Frontend:
```bash
cd client
npm install
npm run dev
```

---

## Troubleshooting
- Payment returns without `agentProfileId`:
  - Frontend falls back to querying `/api/agent-profile/by-user/{userId}`.
- Signature validation failed:
  - Verify VNPay `HashSecret` and exact query string order; ensure no URL decoding issues.
- CORS issues:
  - Ensure API allows the Frontend origin in development.
- Database connection issues:
  - Update `ConnectionStrings.DefaultConnection` to your local SQL Server instance.

---

## License
This project is for educational and internal use. Review licenses of third-party packages before production use.

