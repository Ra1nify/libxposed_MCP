# LibXposed MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/MCP-1.6.1-green.svg)](https://modelcontextprotocol.io)
[![LibXposed API](https://img.shields.io/badge/API-101%20%7C%20102-orange.svg)](https://libxposed.github.io/api/)
[![Cloud Status](https://img.shields.io/badge/Cloud%20Edge-ONLINE-brightgreen.svg)](https://libxposed-mcp.ra1nify.workers.dev)

A full-spectrum, pre-indexed [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server providing instant, structured API lookups, code scaffolding, architecture guidelines, and legacy migration tools for modern **LibXposed** Android hooking framework developers.

Hosted live on Cloudflare Edge with global zero-cold-start performance.

---

## 🚀 Quick Setup & Configuration

### Option A: Cloud Remote MCP (Zero Local Setup - Recommended)

Connect directly to the live Cloudflare Worker without cloning repositories or installing Node.js.

> [!IMPORTANT]
> **Client Compatibility & Transport Notes:**
> 1. **Do NOT append `/sse`**: Use the root endpoint `https://libxposed-mcp.ra1nify.workers.dev`. The `/sse` route is deprecated legacy HTTP+SSE; modern MCP clients and harnesses (such as DSH) use the modern, stateless `streamable-http` protocol on the root path.
> 2. **`transport` Field is Mandatory**: Unlike Cursor which auto-infers, explicit MCP clients (like DSH) strictly require `"transport": "streamable-http"`.

#### Recommended Configuration (DSH, Cursor, Windsurf, Claude Desktop)
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

*Web Dashboard & Health Check*: Visit [https://libxposed-mcp.ra1nify.workers.dev](https://libxposed-mcp.ra1nify.workers.dev) in your browser to verify service status and view available tools.

---

### Option B: Local Standalone Bundle (Offline Stdio Mode)

For offline environments or direct local execution:

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

## 🌟 Capabilities & Full-Spectrum Coverage

Unlike partial references, `libxposed-mcp` models **100% of all 5 core subprojects** of LibXposed plus legacy migration tooling:

1. **`libxposed:api`**: Core interfaces (`XposedInterface`, `XposedModule`, `Hooker`, `Chain`, `Invoker`, `CtorInvoker`, `HookHandle`, `HookBuilder`, `ExceptionMode`, `XposedInterfaceWrapper`), lifecycle callbacks, and official Javadoc hyperlinks.
2. **`libxposed:helper` & `helper-ktx`**: High-performance reflection caching (`Reflector`), fluent class/method matcher sequences (`HookBuilder`), dex analysis, and idiomatic Kotlin DSL.
3. **`libxposed:service`**: Modern cross-process communication (`RemotePreferences` replacing broken `XSharedPreferences`), framework IPC bindings (`XposedService`), process discovery (`HookedTarget`), Hot Reload protocols (`HotReloadResult`), Direct Boot awareness, and AIDL specifications.
4. **`libxposed:lint`**: Version compatibility constraints (`@SinceApi(101/102)`), internal API protection (`@InternalApi`), and lint issue registries.
5. **`libxposed:example`**: Standard project scaffolding (`build.gradle.kts`, `AndroidManifest.xml`, `proguard-rules.pro`, `META-INF/xposed/java_init.list`, `ModuleMain.java`, `ModuleMainKt.kt`).
6. **`migration`**: Comprehensive 1:1 mapping table and before/after transformation guides from legacy XposedBridge (`de.robv.android.xposed.*`) to modern LibXposed.

---

## 🛠️ Available MCP Tools

All 7 tools are fully implemented, verified with unit tests, and accessible over both `streamable-http` and local stdio transports:

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| **`search_libxposed`** | `query` (string), `module?` (`all`, `api`, `helper`, `service`, `lint`, `example`, `migration`) | Universal keyword search across all classes, methods, constants, and migration rules. |
| **`get_api_doc`** | `className` (string), `memberName?` (string) | Deep dive into class or method signatures, parameter descriptions, sinceApi levels, and official Javadoc links. |
| **`get_helper_guide`** | `topic` (`all`, `hook_builder`, `reflector`, `kotlin_dsl`) | Fluent HookBuilder patterns, Reflector reflection helpers, and Kotlin DSL syntax. |
| **`get_service_guide`** | `topic` (`all`, `xposed_service`, `remote_preferences`, `hot_reload`, `direct_boot`, `aidl`) | Cross-process RemotePreferences, reactive change listeners, hot reload state restoration, and AIDL specs. |
| **`get_scaffold`** | `type` (`all`, `build_gradle`, `manifest`, `proguard`, `entry_list`, `java_module`, `kotlin_module`) | Generates standard compile-ready configuration files and module skeleton code. |
| **`migrate_legacy_code`** | `legacySnippet?` (string) | 1:1 mapping table and transformation guides from legacy `XC_MethodHook` / `XSharedPreferences` to LibXposed. |
| **`check_api_compatibility`** | `version` (`101`, `102`, `all`) | Inspects feature differences between API 101 and 102, breaking changes, and `@InternalApi` rules. |

---

## 🧪 Testing & Verification

Run the test suite verifying all 7 tools against local stdio:
```bash
node scripts/test_mcp.mjs
```

Run comprehensive deep verification (34 edge-case tests):
```bash
node scripts/deep_recheck.mjs
```

Verify TypeScript types:
```bash
npm run typecheck
```

---

## 🔄 CI/CD & Automated Deployment

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds, type-checks, and deploys the Cloudflare Worker upon pushing to `master` or `main`.

### Setting up Continuous Deployment:

1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Paste your Cloudflare API Token (with `Workers:Edit` and `Account:Read` permissions).
5. Any subsequent push to `master` / `main` will automatically trigger a fresh deployment to Cloudflare Edge.

---

## 📄 License
Licensed under the [Apache License 2.0](LICENSE).
