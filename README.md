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

