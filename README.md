# RealEstateHub

### About
Full-stack real estate marketplace built with ASP.NET Core 9 and React 19.

**Key Features:**
- 360° Panorama Tours with Three.js
- AI-Powered Listings (OpenAI GPT-4)
- Real-time Chat (SignalR + Stream)
- VNPay & MoMo Payment Integration
- Professional Agent Profiles
- Membership Tiers & Advanced Search

**Tech:** .NET 9, EF Core, SQL Server, React

---

## 🏗 System Architecture

This project is structured as a monorepo containing both the frontend client and the backend API.

- **`api/`**: ASP.NET Core 9 Web API. Follows Clean Architecture principles using Entity Framework Core for data access. Real-time features are powered by SignalR.
- **`client/`**: React 19 application bootstrapped with Vite 6. Utilizes Ant Design and MUI for the component library, with React Router v7 for client-side routing.

---

## 💻 Tech Stack

### Backend
- **Framework:** .NET 9 (ASP.NET Core)
- **Database:** SQL Server, Entity Framework Core 9
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** SignalR
- **API Documentation:** OpenAPI / Swagger

### Frontend
- **Framework:** React 19, Vite 6
- **UI Libraries:** Ant Design 5, MUI 7, TailwindCSS
- **State Management & Data Fetching:** Axios
- **Graphics & 3D:** Three.js (for Panorama Tours)

---

## 🌟 Core Modules

### 1. 360° Panorama Virtual Tours
Fully custom-built 360° panorama tour system using Three.js. Supports multi-scene tours, hotspot navigation, and mobile-friendly drag/touch controls. The module handles efficient texture rendering and raycasting for a seamless client-side experience.

### 2. AI-Powered Content Generation
Integrated with OpenAI's GPT-4 to assist users in generating optimized property titles and descriptions. Context-aware prompts utilize property attributes to deliver precise, structured content with customizable professional tones.

### 3. Payment Processing
Secure, sandbox-ready integrations with VNPay and MoMo e-wallets. The system handles complex checkout flows including secure URL generation, webhook processing (IPN), and signature validations ensuring transaction integrity for membership upgrades.

### 4. Real-time Chat & Notifications
Instant messaging between buyers, sellers, and agents powered by ASP.NET Core SignalR. Asynchronous notifications support critical alerts for system events, successful payments, and account status updates.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- .NET SDK 9.0+
- SQL Server (Developer/Express edition)

### Backend (API) Setup

1. **Configuration:**
   Navigate to the `api/` directory and set up your `appsettings.Development.json`. Update the connection strings and provide your own API keys for external services. 
   > **Note:** Do not hardcode or commit keys to version control. Use .NET User Secrets in development.
   
   Required configuration sections:
   - `ConnectionStrings:DefaultConnection`
   - `Jwt:Key` (Minimum 32 bytes)
   - `Vnpay` & `MomoAPI` gateway configurations
   - `OpenAI:ApiKey`

2. **Database Migration:**
   ```bash
   dotnet restore
   dotnet ef database update --project api/RealEstateHubAPI.csproj
   ```

3. **Run the API:**
   ```bash
   dotnet run --project api/RealEstateHubAPI.csproj
   ```
   > The Swagger UI will be available at `{API_BASE_URL}/swagger`.

### Frontend (Client) Setup

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Environment Variables:**
   Ensure your `.env` connects to the correct API base URL.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   > The application will be running at `http://localhost:5173`.

---

## 🛡 Security & Environment Guidelines

- **Secrets Management:** Never commit API keys, HashSecrets, or Connection Strings to the repository. Use environment variables or Key Vault mechanisms in production.
- **Payment Callbacks:** Ensure the IPN webhooks and redirect URLs map correctly to your public-facing domains. Gateway signature validations are strictly required on all incoming webhooks.
- **CORS Configuration:** Enforce strict CORS policies in `Program.cs` before deploying to production.

---

## 📝 License
This project is intended for educational and internal portfolio use. Review licensing terms for all third-party libraries (e.g., UI components, 3D engines) before public distribution.
