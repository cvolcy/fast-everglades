## Summary

This PR upgrades the Azure Functions application in `/core` from .NET Core 2.1 in-process model to .NET 10 using the isolated worker model.

Fixes infinite loop issues by removing problematic localhost proxy configurations and updating the project to use the modern isolated worker pattern.

## Changes

### Core Updates
- **fast-everglades.csproj**: 
  - Target framework: `netcoreapp2.1` → `net10.0`
  - SDK: `Microsoft.NET.Sdk` → `Microsoft.NET.Sdk.Worker`
  - Azure Functions Version: `V2` → `V4`
  - Updated package versions

- **staticFile.cs**: 
  - Migrated from static class to instance-based with dependency injection
  - Updated attributes: `[FunctionName]` → `[Function]`
  - Updated HTTP types: `HttpResponseMessage` → `HttpResponseData`, `HttpRequest` → `HttpRequestData`
  - Changed query parameter access: `GetQueryParameterDictionary()` → `req.Query`

- **Program.cs** (NEW):
  - Added isolated worker host configuration
  - Enables dependency injection support

### Bug Fixes
- **proxies.json**: Removed localhost proxies causing infinite loop detection
  - Kept: External service proxies (Node.js and Python APIs)
  - Removed: Routes that proxied back to staticFile function

### Development Setup
- **.vscode/settings.json**: Updated runtime to v4 and deployment paths for .NET 10

## Migration Details

The isolated worker model provides:
- ✅ Better performance and scalability
- ✅ Improved dependency injection support
- ✅ Modern .NET best practices
- ✅ No more proxy infinite loop issues

## Testing Checklist
- [ ] Build the project locally: `dotnet build`
- [ ] Test static file serving
- [ ] Verify external API proxies work (Node.js/Python)
- [ ] Deploy to Azure and test in production environment

## Related Documentation
- [Azure Functions Isolated Worker Process](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide)
- [.NET 10 Release Notes](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10)
