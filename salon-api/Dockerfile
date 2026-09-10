FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Salon.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 libkrb5-3 && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
CMD ["sh", "-c", "dotnet Salon.Api.dll --urls http://+:${PORT:-8080}"]