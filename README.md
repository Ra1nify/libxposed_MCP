# LibXposed MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/MCP-1.6.1-green.svg)](https://modelcontextprotocol.io)
[![LibXposed API](https://img.shields.io/badge/API-101%20%7C%20102-orange.svg)](https://libxposed.github.io/api/)

A full-spectrum, pre-indexed [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server providing instant, structured API lookups, code scaffolding, architecture guidelines, and legacy migration tools for modern **LibXposed** Android hooking framework developers.

---

## 🌟 Capabilities & Full-Spectrum Coverage

Unlike partial references, `libxposed-mcp` covers **100% of all 5 core subprojects** of LibXposed plus legacy migration tooling:

1. **`libxposed:api`**: Core interfaces (`XposedInterface`, `XposedModule`, `Hooker`, `Chain`, `Invoker`, `CtorInvoker`, `HookHandle`, `HookBuilder`, `ExceptionMode`), lifecycle callbacks, and official Javadoc hyperlinks.
2. **`libxposed:helper` & `helper-ktx`**: High-performance reflection caching (`Reflector`), fluent class/method matcher sequences (`HookBuilder`), dex analysis, and idiomatic Kotlin DSL.
3. **`libxposed:service`**: Modern cross-process communication (`RemotePreferences` replacing broken `XSharedPreferences`), framework IPC bindings (`XposedService`), Hot Reload protocols, and AIDL specifications.
4. **`libxposed:lint`**: Version compatibility constraints (`@SinceApi(101/102)`), internal API protection (`@InternalApi`), and lint issue registries.
5. **`libxposed:example`**: Standard project scaffolding (`build.gradle.kts`, `AndroidManifest.xml`, `proguard-rules.pro`, `META-INF/xposed/java_init.list`, `ModuleMain.java`, `ModuleMainKt.kt`).
6. **`migration`**: Comprehensive 1:1 mapping table and before/after transformation guides from legacy XposedBridge (`de.robv.android.xposed.*`) to modern LibXposed.

---

## 🛠️ Provided MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_libxposed` | `query`, `module?` (`all`, `api`, `helper`, `service`, `lint`, `example`, `migration`) | Universal keyword search across all classes, methods, constants, and migration rules. |
| `get_api_doc` | `className`, `memberName?` | Deep dive into class or method signatures, parameter descriptions, sinceApi levels, and official Javadoc links. |
| `get_helper_guide` | `topic` (`all`, `hook_builder`, `reflector`, `kotlin_dsl`) | Fluent HookBuilder patterns, Reflector reflection helpers, and Kotlin DSL syntax. |
| `get_service_guide` | `topic` (`all`, `remote_preferences`, `hot_reload`, `aidl`) | Cross-process RemotePreferences, reactive change listeners, hot reload state restoration, and AIDL specs. |
| `get_scaffold` | `type` (`all`, `build_gradle`, `manifest`, `proguard`, `entry_list`, `java_module`, `kotlin_module`) | Generates standard compile-ready configuration files and module skeleton code. |
| `migrate_legacy_code` | `legacySnippet?` | 1:1 mapping table and transformation guides from legacy `XC_MethodHook` / `XSharedPreferences` to LibXposed. |
| `check_api_compatibility` | `version` (`101`, `102`, `all`) | Inspects feature differences between API 101 and 102, breaking changes, and `@InternalApi` rules. |

---

## 🚀 Setup & Local Usage (Phase 1)

### 1. Build the Standalone Bundle
```bash
npm install
npm run build
```
This generates a single, zero-external-dependency bundle at `dist/index.js`.

### 2. Configure Your AI Client

#### Cursor / Windsurf / Antigravity (`mcp.json` / Settings)
Add the local Stdio server configuration:
```json
{
  "mcpServers": {
    "libxposed": {
      "command": "node",
      "args": ["C:/Users/aka/Desktop/Portal/Projekt/libxposed_MCP/dist/index.js"]
    }
  }
}
```

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "libxposed": {
      "command": "node",
      "args": ["C:/Users/aka/Desktop/Portal/Projekt/libxposed_MCP/dist/index.js"]
    }
  }
}
```

---

## 🗺️ Roadmap & Deployment Progression

- [x] **Phase 1: Local Stdio Package (Current)**
  - Fully modeled offline static index with zero runtime AST overhead.
  - 100% domain coverage across all 5 LibXposed subprojects.
  - Bundled standalone executable `dist/index.js`.
- [ ] **Phase 2: One-Click CLI Distribution (`npx`)**
  - Publish to npm registry (`libxposed-mcp`).
  - Zero git-clone friction: run directly via `npx -y libxposed-mcp`.
- [ ] **Phase 3: Cloud Edge Deployment (Remote SSE)**
  - Deploy server to Cloudflare Workers / Vercel.
  - Zero local dependencies: configure with a single URL endpoint (`https://.../sse`).

---

## 🧪 Testing

Run the automated test runner verifying all 7 tools:
```bash
node scripts/test_mcp.mjs
```

---

## 📄 License
Licensed under the [Apache License 2.0](LICENSE).
