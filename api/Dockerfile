# Sử dụng image .NET 9 ASP.NET làm base
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Build project
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy chỉ file csproj trước để tận dụng cache
COPY ["RealEstateHubAPI.csproj", "./"]
RUN dotnet restore "./RealEstateHubAPI.csproj"

# Copy toàn bộ mã nguồn còn lại
COPY . .
WORKDIR /src
RUN dotnet build "RealEstateHubAPI.csproj" -c Release -o /app/build

# Publish để lấy file chạy
FROM build AS publish
RUN dotnet publish "RealEstateHubAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Tạo image cuối cùng
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render/Koyeb thường sử dụng cổng 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "RealEstateHubAPI.dll"]
