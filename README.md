# LibXposed MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/MCP-1.32.2-green.svg)](https://modelcontextprotocol.io)
[![LibXposed API](https://img.shields.io/badge/API-101%20%7C%20102-orange.svg)](https://libxposed.github.io/api/)
[![Cloud Status](https://img.shields.io/badge/Cloud%20Edge-ONLINE-brightgreen.svg)](https://libxposed-mcp.ra1nify.workers.dev)

A structured, full-spectrum Model Context Protocol (MCP) server providing API references, architectural guides, code scaffolding, and legacy migration tools for modern LibXposed Android development.

Deployed globally on Cloudflare Edge with zero cold start.

---

## Quick Setup

### Option A: Remote Server (Recommended)

Connect directly to the deployed Cloudflare Edge endpoint without local installation.

> [!IMPORTANT]
> **Transport and Protocol Requirements**
> - **Endpoint Path**: Use the root path (`https://libxposed-mcp.ra1nify.workers.dev`). Do not append `/sse`. Modern MCP clients communicate over stateless `streamable-http` at the root path.
> - **Transport Field**: Explicit MCP environments (such as DSH) require `"transport": "streamable-http"`.

#### Client Configuration (DSH, Cursor, Windsurf, Claude Desktop)

```json
{
  "mcpServers": {
    "libxposed": {
      "url": "https://libxposed-mcp.ra1nify.workers.dev",
      "transport": "streamable-http"
    }
  }
}
```

*Web Dashboard*: Visit [https://libxposed-mcp.ra1nify.workers.dev](https://libxposed-mcp.ra1nify.workers.dev) for server health and tool discovery.

---

### Option B: Local Stdio Mode

Run as a local process via standard input/output.

#### 1. Build Bundle
```bash
npm install
npm run build
```

#### 2. Configure Local Client
```json
{
  "mcpServers": {
    "libxposed": {
      "command": "node",
      "args": ["<PATH_TO_PROJECT>/dist/index.js"]
    }
  }
}
```

---

## Architecture and Coverage

The server models 100% of all five LibXposed subprojects and legacy migration pathways:

1. **`libxposed:api`**: Core hook interfaces (`XposedInterface`, `XposedModule`, `Hooker`, `Chain`, `Invoker`, `CtorInvoker`, `HookHandle`, `HookBuilder`, `ExceptionMode`, `XposedInterfaceWrapper`), module lifecycle events, and Javadoc references.
2. **`libxposed:helper` & `helper-ktx`**: High-throughput reflection caching (`Reflector`), fluent matching chains (`HookBuilder`), dex analysis, and idiomatic Kotlin DSL.
3. **`libxposed:service`**: Cross-process communication (`RemotePreferences` replacing legacy `XSharedPreferences`), framework IPC bindings (`XposedService`), target discovery (`HookedTarget`), hot reload protocols (`HotReloadResult`), Direct Boot compatibility, and AIDL specifications.
4. **`libxposed:lint`**: API level compatibility constraints (`@SinceApi(101/102)`), internal API restrictions (`@InternalApi`), and lint checks.
5. **`libxposed:example`**: Standard project templates (`build.gradle.kts`, `AndroidManifest.xml`, `proguard-rules.pro`, `META-INF/xposed/java_init.list`, `ModuleMain.java`, `ModuleMainKt.kt`).
6. **`migration`**: 1:1 mapping definitions and structural transformation guides from legacy XposedBridge (`de.robv.android.xposed.*`) to modern LibXposed.

---

## Available MCP Tools

All seven tools operate across both `streamable-http` and local `stdio` transports:

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| **`search_libxposed`** | `query` (string), `module?` (`all`, `api`, `helper`, `service`, `lint`, `example`, `migration`) | Search across classes, methods, constants, architecture guides, and migration rules. |
| **`get_api_doc`** | `className` (string), `memberName?` (string) | Query signatures, parameter specifications, sinceApi constraints, and Javadoc links. |
| **`get_helper_guide`** | `topic` (`all`, `hook_builder`, `reflector`, `kotlin_dsl`) | Retrieve HookBuilder patterns, Reflector caching mechanisms, and Kotlin DSL usage. |
| **`get_service_guide`** | `topic` (`all`, `xposed_service`, `remote_preferences`, `hot_reload`, `direct_boot`, `aidl`) | Access RemotePreferences IPC guides, reactive listener examples, and AIDL definitions. |
| **`get_scaffold`** | `type` (`all`, `build_gradle`, `manifest`, `proguard`, `entry_list`, `java_module`, `kotlin_module`) | Generate compile-ready project configurations and module skeletons. |
| **`migrate_legacy_code`** | `legacySnippet?` (string) | Provide 1:1 migration maps and code conversions from legacy XposedBridge to LibXposed. |
| **`check_api_compatibility`** | `version` (`101`, `102`, `all`) | Inspect API 101/102 differences, breaking changes, and @InternalApi enforcement. |

---

## Verification and Testing

Execute the test suites to verify server behavior:

```bash
# Run stdio tool invocation test
npm test

# Run exhaustive edge-case test suite (34 cases)
npm run test:deep

# Run TypeScript static analysis
npm run typecheck
```

---

## CI/CD and Deployment

Automated delivery is managed by GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Each push to `master` or `main` automatically type-checks, builds, and deploys the Cloudflare Worker.

### Continuous Deployment Setup:
1. Navigate to **Settings** > **Secrets and variables** > **Actions** in your GitHub repository.
2. Add a new secret named `CLOUDFLARE_API_TOKEN` containing your Cloudflare API token (`Workers:Edit` permissions).
3. Pushes to `master` will deploy directly to Cloudflare Edge using Node.js 22 and Wrangler v4.

---

## License

Licensed under the [Apache License 2.0](LICENSE).
