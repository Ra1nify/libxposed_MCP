import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import apiDataRaw from "./data/api.json" with { type: "json" };
import helperDataRaw from "./data/helper.json" with { type: "json" };
import serviceDataRaw from "./data/service.json" with { type: "json" };
import lintDataRaw from "./data/lint.json" with { type: "json" };
import exampleDataRaw from "./data/example.json" with { type: "json" };
import migrationDataRaw from "./data/migration.json" with { type: "json" };

import type {
  ApiModuleData,
  HelperModuleData,
  ServiceModuleData,
  LintModuleData,
  ExampleModuleData,
  MigrationModuleData,
} from "./types.js";

const apiData = apiDataRaw as ApiModuleData;
const helperData = helperDataRaw as HelperModuleData;
const serviceData = serviceDataRaw as ServiceModuleData;
const lintData = lintDataRaw as LintModuleData;
const exampleData = exampleDataRaw as ExampleModuleData;
const migrationData = migrationDataRaw as MigrationModuleData;

function getAllClasses(): any[] {
  const all: any[] = [];
  if (apiData.classes) all.push(...apiData.classes);
  if ((helperData as any).classes) all.push(...(helperData as any).classes);
  if (helperData.components) all.push(...helperData.components);
  if (serviceData.classes) all.push(...serviceData.classes);
  if ((lintData as any).classes) all.push(...(lintData as any).classes);
  return all;
}

export function createLibXposedServer(): McpServer {
  const server = new McpServer({
    name: "libxposed-mcp",
    version: "1.0.0",
  });

  // Tool 1: Precise Symbol Lookup (FQN, method, class, package-info, annotation)
  server.tool(
    "get_symbol",
    "Retrieve exact signature, sinceApi, source location (filePath:line), parameters, and Javadoc for any symbol (class, interface, method, constant, package-info, annotation) across all 5 LibXposed subprojects.",
    {
      symbol: z.string().describe("Fully qualified name or symbol name (e.g., 'io.github.libxposed.api.XposedInterface#hook', 'HookBuilder#fragment', 'package-info', 'RemotePreferences', 'Reflector#unreflect', 'deoptimize')"),
    },
    async ({ symbol }) => {
      const q = symbol.trim();
      const allClasses = getAllClasses();

      // Check if query contains '#' (e.g., ClassName#methodName)
      if (q.includes("#")) {
        const [classPart, memberPart] = q.split("#");
        const targetCls = allClasses.find(
          (c) =>
            c.name?.toLowerCase() === classPart.toLowerCase() ||
            c.simpleName?.toLowerCase() === classPart.toLowerCase() ||
            c.name?.toLowerCase().endsWith("." + classPart.toLowerCase())
        );

        if (targetCls) {
          const m = targetCls.methods?.find((x: any) => x.name?.toLowerCase() === memberPart.toLowerCase());
          const cn = targetCls.constants?.find((x: any) => x.name?.toLowerCase() === memberPart.toLowerCase());

          if (m) {
            return {
              content: [
                {
                  type: "text",
                  text: `# Symbol: \`${targetCls.name}#${m.name}\`\n\n` +
                    `- **Type**: \`method\`\n` +
                    `- **Since API**: \`${m.sinceApi || targetCls.sinceApi || 101}\`\n` +
                    `- **Source Location**: \`${targetCls.filePath || "api/api/src/main/java"}:${m.line || 1}\`\n` +
                    `- **Signature**: \`${m.signature}\`\n` +
                    `- **Return Type**: \`${m.returnType || "void"}\`\n` +
                    `- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n` +
                    `### Description\n${m.doc || targetCls.summary}\n\n` +
                    `${m.params && m.params.length > 0 ? "### Parameters\n" + m.params.map((p: string) => "- `" + p + "`").join("\n") : ""}`,
                },
              ],
            };
          }

          if (cn) {
            return {
              content: [
                {
                  type: "text",
                  text: `# Symbol: \`${targetCls.name}.${cn.name}\`\n\n` +
                    `- **Type**: \`constant\`\n` +
                    `- **Value**: \`${cn.value}\`\n` +
                    `- **Source Location**: \`${targetCls.filePath || "api/api/src/main/java"}\`\n` +
                    `- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n` +
                    `### Description\n${cn.doc}`,
                },
              ],
            };
          }
        }
      }

      // Exact or suffix class lookup (e.g. package-info, XposedInterface, Reflector)
      const targetCls = allClasses.find(
        (c) =>
          c.name?.toLowerCase() === q.toLowerCase() ||
          c.simpleName?.toLowerCase() === q.toLowerCase() ||
          c.name?.toLowerCase().endsWith("." + q.toLowerCase())
      );

      if (targetCls) {
        let doc = `# ${targetCls.name}\n\n` +
          `- **Type**: \`${targetCls.type || "class"}\`\n` +
          `- **Since API**: \`${targetCls.sinceApi || 101}\`\n` +
          `- **Source Location**: \`${targetCls.filePath || "libxposed/api"}\`\n` +
          `- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n` +
          `### Overview\n${targetCls.summary}\n`;

        if (targetCls.constants && targetCls.constants.length > 0) {
          doc += `\n### Constants\n| Name | Type | Value | Description |\n|---|---|---|---|\n`;
          for (const cn of targetCls.constants) {
            doc += `| \`${cn.name}\` | \`${cn.type}\` | \`${cn.value}\` | ${cn.doc} |\n`;
          }
        }

        if (targetCls.methods && targetCls.methods.length > 0) {
          doc += `\n### Methods (${targetCls.methods.length})\n`;
          for (const mt of targetCls.methods) {
            doc += `- **\`${mt.name}\`** (Since API ${mt.sinceApi || targetCls.sinceApi || 101}): \`${mt.signature}\`\n  ${mt.doc}\n`;
          }
        }

        return { content: [{ type: "text", text: doc }] };
      }

      // Search member name across all classes if no class match was found
      const matches: string[] = [];
      for (const c of allClasses) {
        if (c.methods) {
          for (const m of c.methods) {
            if (m.name?.toLowerCase() === q.toLowerCase() || m.signature?.toLowerCase().includes(q.toLowerCase())) {
              matches.push(`### Method: \`${c.name}#${m.name}\`\n- **Signature**: \`${m.signature}\`\n- **Since API**: ${m.sinceApi || c.sinceApi}\n- **Source**: \`${c.filePath}:${m.line || 1}\`\n- **Doc**: ${m.doc || c.summary}`);
            }
          }
        }
        if (c.constants) {
          for (const cn of c.constants) {
            if (cn.name?.toLowerCase() === q.toLowerCase()) {
              matches.push(`### Constant: \`${c.name}.${cn.name}\`\n- **Value**: \`${cn.value}\`\n- **Source**: \`${c.filePath}\`\n- **Doc**: ${cn.doc}`);
            }
          }
        }
      }

      if (matches.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `Found ${matches.length} matching symbol(s) for "${symbol}":\n\n` + matches.join("\n\n---\n\n"),
            },
          ],
        };
      }

      const availableNames = allClasses.map((c) => c.simpleName || c.name.split(".").pop()).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Symbol "${symbol}" not found in LibXposed codebase.\nAvailable symbols/classes include: ${availableNames}`,
          },
        ],
      };
    }
  );

  // Tool 2: Universal Search across all 6 domains
  server.tool(
    "search_libxposed",
    "Search across all LibXposed modules (api, helper, service, lint, example, migration) by keyword, class name, method name, or concept.",
    {
      query: z.string().describe("Search term, e.g., 'hook', 'Invoker', 'RemotePreferences', 'onPackageReady', 'SinceApi', 'XSharedPreferences', 'package-info'"),
      module: z.enum(["all", "api", "helper", "service", "lint", "example", "migration"]).optional().describe("Optional module scope to filter search results (default: 'all')"),
    },
    async ({ query, module = "all" }) => {
      const q = query.toLowerCase();
      const results: string[] = [];
      const allClasses = getAllClasses();

      if (module === "all" || module === "api" || module === "helper" || module === "service" || module === "lint") {
        for (const cls of allClasses) {
          if (cls.name?.toLowerCase().includes(q) || cls.summary?.toLowerCase().includes(q) || cls.simpleName?.toLowerCase().includes(q)) {
            results.push(`### [Class] ${cls.name}\n- **Type**: ${cls.type || "class"} (Since API ${cls.sinceApi || 101})\n- **Source File**: \`${cls.filePath || "libxposed"}\`\n- **Summary**: ${cls.summary}\n- **Javadoc**: ${cls.javadocUrl || apiData.javadocBaseUrl}`);
          }
          if (cls.methods) {
            for (const m of cls.methods) {
              if (m.name?.toLowerCase().includes(q) || m.signature?.toLowerCase().includes(q) || m.doc?.toLowerCase().includes(q)) {
                results.push(`### [Method] ${cls.name}#${m.name}\n- **Signature**: \`${m.signature}\`\n- **Source**: \`${cls.filePath}:${m.line || 1}\`\n- **Doc**: ${m.doc || ""}\n- **Since API**: ${m.sinceApi || cls.sinceApi || 101}`);
              }
            }
          }
          if (cls.constants) {
            for (const c of cls.constants) {
              if (c.name?.toLowerCase().includes(q) || c.doc?.toLowerCase().includes(q)) {
                results.push(`### [Constant] ${cls.name}.${c.name}\n- **Type**: \`${c.type}\` = \`${c.value}\`\n- **Doc**: ${c.doc || ""}`);
              }
            }
          }
        }
      }

      if (module === "all" || module === "lint") {
        for (const ann of lintData.annotations) {
          if (ann.name?.toLowerCase().includes(q) || ann.doc?.toLowerCase().includes(q)) {
            results.push(`### [Lint Annotation] ${ann.name}\n- **Targets**: ${ann.target.join(", ")}\n- **Rule**: ${ann.doc}`);
          }
        }
        for (const lvl of lintData.apiLevels) {
          if (lvl.name?.toLowerCase().includes(q) || lvl.features?.some(f => f?.toLowerCase().includes(q))) {
            results.push(`### [API Level Specification] ${lvl.name} (v${lvl.version})\n- **Features**: ${lvl.features.join("; ")}`);
          }
        }
      }

      if (module === "all" || module === "migration") {
        for (const m of migrationData.mappings) {
          if (m.legacy?.toLowerCase().includes(q) || m.modern?.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q)) {
            results.push(`### [Migration Mapping]\n- **Legacy**: \`${m.legacy}\`\n- **Modern LibXposed**: \`${m.modern}\`\n- **Notes**: ${m.notes}`);
          }
        }
      }

      const output = results.length > 0
        ? `Found ${results.length} result(s) for query "${query}":\n\n` + results.join("\n\n---\n\n")
        : `No direct matches found across LibXposed modules for query "${query}". Try searching for broader terms such as 'hook', 'invoker', 'preferences', or 'package'.`;

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  // Tool 3: Detailed Class Documentation (No hardcoded whitelist)
  server.tool(
    "get_api_doc",
    "Retrieve detailed documentation, method signatures, parameters, return types, sinceApi version, and official Javadoc links for any LibXposed class.",
    {
      className: z.string().describe("Name of the class, interface, or package-info (e.g., 'XposedInterface', 'XposedModule', 'RemotePreferences', 'HookBuilderImpl', 'package-info')"),
      memberName: z.string().optional().describe("Optional method or constant name to focus on (e.g., 'hook', 'deoptimize', 'proceed', 'replaceHook', 'API_102')"),
    },
    async ({ className, memberName }) => {
      const allClasses = getAllClasses();
      const targetCls = allClasses.find(
        (c) =>
          c.name?.toLowerCase() === className.toLowerCase() ||
          c.simpleName?.toLowerCase() === className.toLowerCase() ||
          c.name?.toLowerCase().endsWith("." + className.toLowerCase())
      );

      if (!targetCls) {
        const available = allClasses.map((c) => c.simpleName || c.name.split(".").pop()).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Class "${className}" not found in LibXposed codebase.\nAvailable classes: ${available}`,
            },
          ],
        };
      }

      if (memberName) {
        const m = targetCls.methods?.find((x: any) => x.name?.toLowerCase() === memberName.toLowerCase());
        const c = targetCls.constants?.find((x: any) => x.name?.toLowerCase() === memberName.toLowerCase());

        if (m) {
          return {
            content: [
              {
                type: "text",
                text: `# ${targetCls.name}#${m.name}\n\n- **Signature**: \`${m.signature}\`\n- **Return Type**: \`${m.returnType || "void"}\`\n- **Since API**: ${m.sinceApi || targetCls.sinceApi || 101}\n- **Source File**: \`${targetCls.filePath}:${m.line || 1}\`\n- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n### Description\n${m.doc || targetCls.summary}\n\n${m.params && m.params.length > 0 ? "### Parameters\n" + m.params.map((p: string) => "- `" + p + "`").join("\n") : ""}`,
              },
            ],
          };
        }

        if (c) {
          return {
            content: [
              {
                type: "text",
                text: `# ${targetCls.name}.${c.name}\n\n- **Type**: \`${c.type}\`\n- **Value**: \`${c.value}\`\n- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n### Description\n${c.doc}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Member "${memberName}" not found in class "${targetCls.name}".`,
            },
          ],
        };
      }

      let doc = `# ${targetCls.name}\n\n- **Type**: \`${targetCls.type || "class"}\`\n- **Since API**: ${targetCls.sinceApi || 101}\n- **Source Location**: \`${targetCls.filePath || "libxposed"}\`\n- **Official Javadoc**: ${targetCls.javadocUrl || apiData.javadocBaseUrl}\n\n### Overview\n${targetCls.summary}\n`;

      if (targetCls.constants && targetCls.constants.length > 0) {
        doc += `\n### Constants\n| Name | Type | Value | Description |\n|---|---|---|---|\n`;
        for (const cn of targetCls.constants) {
          doc += `| \`${cn.name}\` | \`${cn.type}\` | \`${cn.value}\` | ${cn.doc} |\n`;
        }
      }

      if (targetCls.methods && targetCls.methods.length > 0) {
        doc += `\n### Methods (${targetCls.methods.length})\n`;
        for (const mt of targetCls.methods) {
          doc += `- **\`${mt.name}\`** (Since API ${mt.sinceApi || targetCls.sinceApi || 101}): \`${mt.signature}\`\n  ${mt.doc}\n`;
        }
      }

      return {
        content: [{ type: "text", text: doc }],
      };
    }
  );

  // Tool 4: Helper & Kotlin DSL Guide
  server.tool(
    "get_helper_guide",
    "Get comprehensive guides and API references for libxposed:helper, including HookBuilder fluent discovery, Reflector reflection utilities, and Kotlin helper-ktx DSL.",
    {
      topic: z.enum(["all", "hook_builder", "reflector", "kotlin_dsl"]).describe("Topic to retrieve: 'hook_builder' for fluent discovery, 'reflector' for reflection caching, 'kotlin_dsl' for Kotlin extensions, or 'all'"),
    },
    async ({ topic }) => {
      let output = `# LibXposed Helper Kit Reference (libxposed:helper & helper-ktx)\n\n`;

      if (topic === "all" || topic === "hook_builder") {
        const hb = helperData.components.find((c) => c.name.includes("HookBuilder"));
        output += `## 1. HookBuilder (Fluent Discovery & Dex Analysis)\n${hb?.summary}\n\n### Key Methods:\n`;
        if (hb?.methods) {
          for (const m of hb.methods) {
            output += `- **\`${m.name}\`**: \`${m.signature}\`\n  ${m.doc}\n`;
          }
        }
        output += `\n`;
      }

      if (topic === "all" || topic === "reflector") {
        const rf = helperData.components.find((c) => c.name.includes("Reflector"));
        output += `## 2. Reflector (High-Performance Reflection)\n${rf?.summary}\n\n### Key Methods:\n`;
        if (rf?.methods) {
          for (const m of rf.methods) {
            output += `- **\`${m.name}\`**: \`${m.signature}\`\n  ${m.doc}\n`;
          }
        }
        output += `\n`;
      }

      if (topic === "all" || topic === "kotlin_dsl") {
        const ktx = helperData.components.find((c) => c.name.includes("ktx"));
        output += `## 3. Kotlin DSL (helper-ktx)\n${ktx?.summary}\n\n`;
        if (ktx?.patterns) {
          for (const p of ktx.patterns) {
            output += `### ${p.title}\n\`\`\`kotlin\n${p.code}\n\`\`\`\n\n`;
          }
        }
      }

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  // Tool 5: Service, IPC, Direct Boot, and Hot Reload Guide
  server.tool(
    "get_service_guide",
    "Get comprehensive guides for libxposed:service, including XposedService, XposedServiceHelper, modern RemotePreferences, HookedTarget process introspection, Hot Reload protocols, Direct Boot rules, and AIDL definitions.",
    {
      topic: z.enum(["all", "remote_preferences", "xposed_service", "hot_reload", "direct_boot", "aidl"]).describe("Service topic to retrieve: 'xposed_service', 'remote_preferences', 'hot_reload', 'direct_boot', 'aidl', or 'all'"),
    },
    async ({ topic }) => {
      let output = `# LibXposed Service & IPC Architecture (libxposed:service)\n\n`;

      if (serviceData.artifacts) {
        output += `### Gradle Dependencies:\n`;
        for (const art of serviceData.artifacts) {
          output += `- **${art.target}**: \`${art.coordinate}\` (\`${art.instruction}\`)\n`;
        }
        output += `\n`;
      }

      if (topic === "all" || topic === "direct_boot") {
        output += `## 1. Direct Boot Awareness\n${serviceData.directBoot?.summary}\n\n### Critical Rules:\n`;
        if (serviceData.directBoot?.guidelines) {
          output += serviceData.directBoot.guidelines.map((g) => "- " + g).join("\n") + "\n\n";
        }
      }

      if (topic === "all" || topic === "xposed_service") {
        const xs = serviceData.classes.find((c) => c.name.endsWith(".XposedService"));
        const xsh = serviceData.classes.find((c) => c.name.endsWith(".XposedServiceHelper"));
        output += `## 2. XposedService & XposedServiceHelper\n${xs?.summary}\n\n`;
        output += `### Connecting via XposedServiceHelper:\n`;
        const bindPattern = serviceData.patterns?.find((p) => p.title.includes("Binding to XposedService"));
        if (bindPattern) {
          output += `\`\`\`java\n${bindPattern.code}\n\`\`\`\n\n`;
        }
        output += `### XposedService Methods:\n`;
        if (xs?.methods) {
          for (const m of xs.methods) {
            output += `- **\`${m.name}\`**: \`${m.signature}\`\n  ${m.doc}\n`;
          }
        }
        output += `\n`;
      }

      if (topic === "all" || topic === "remote_preferences") {
        const rp = serviceData.classes.find((c) => c.name.endsWith(".RemotePreferences"));
        output += `## 3. RemotePreferences (Modern Cross-Process SharedPreferences)\n${rp?.summary}\n\n`;
        output += `### Methods in Hooked & Module Processes:\n`;
        if (rp?.methods) {
          for (const m of rp.methods) {
            output += `- **\`${m.name}\`**: \`${m.signature}\`\n  ${m.doc}\n`;
          }
        }
        const prefPattern = serviceData.patterns?.find((p) => p.title.includes("Reading RemotePreferences"));
        if (prefPattern) {
          output += `\n### Reactive Usage Example:\n\`\`\`kotlin\n${prefPattern.code}\n\`\`\`\n\n`;
        }
      }

      if (topic === "all" || topic === "hot_reload") {
        const ht = serviceData.classes.find((c) => c.name.endsWith(".HookedTarget"));
        const hr = serviceData.classes.find((c) => c.name.endsWith(".HotReloadResult"));
        output += `## 4. Hot Reload Protocol (API 102+)\n`;
        output += `Hot reload allows modules to update hooks dynamically without restarting the hooked application process.\n\n`;
        output += `### Process Introspection via HookedTarget:\n`;
        output += `- States: \`${ht?.innerTypes?.find((i) => i.name === "State")?.values?.join(", ")}\`\n`;
        output += `- Properties: ${ht?.properties?.map((p) => `\`${p.name}\` (${p.doc})`).join(", ")}\n\n`;
        output += `### HotReloadResult Status:\n`;
        output += `- Statuses: \`${hr?.innerTypes?.find((i) => i.name === "Status")?.values?.join(", ")}\`\n\n`;
        const reloadPattern = serviceData.patterns?.find((p) => p.title.includes("Triggering Hot Reload"));
        if (reloadPattern) {
          output += `### Triggering Hot Reload from Module App:\n\`\`\`java\n${reloadPattern.code}\n\`\`\`\n\n`;
        }
      }

      if (topic === "all" || topic === "aidl") {
        output += `## 5. Framework AIDL Interfaces\n\n`;
        if (serviceData.aidl) {
          for (const a of serviceData.aidl) {
            output += `- **\`${a.name}\`**: ${a.summary}\n`;
          }
        }
      }

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  // Tool 6: Scaffolding, Manifest, ProGuard, Gradle & Reference Modules
  server.tool(
    "get_scaffold",
    "Generate standard project scaffolds and configurations for LibXposed modules, including build.gradle.kts, AndroidManifest.xml, ProGuard/R8 rules, entry list, and Java/Kotlin module skeletons.",
    {
      type: z.enum(["all", "build_gradle", "manifest", "proguard", "entry_list", "java_module", "kotlin_module"]).describe("Type of configuration or code scaffold to generate"),
    },
    async ({ type }) => {
      let output = `# LibXposed Project Scaffolding & Specifications\n\n`;
      const t = exampleData.templates;

      if (type === "all" || type === "build_gradle") {
        output += `## 1. build.gradle.kts\n\`\`\`kotlin\n${t.build_gradle_kts}\n\`\`\`\n\n`;
      }

      if (type === "all" || type === "manifest") {
        output += `## 2. AndroidManifest.xml\n\`\`\`xml\n${t.manifest_xml}\n\`\`\`\n\n`;
      }

      if (type === "all" || type === "proguard") {
        output += `## 3. proguard-rules.pro (Crucial for R8 Optimization)\n\`\`\`proguard\n${t.proguard_rules}\n\`\`\`\n\n`;
      }

      if (type === "all" || type === "entry_list") {
        output += `## 4. META-INF/xposed/java_init.list\n\`\`\`text\n${t.java_init_list}\n\`\`\`\n*(Place in app/src/main/resources/META-INF/xposed/java_init.list)*\n\n`;
      }

      if (type === "all" || type === "java_module") {
        output += `## 5. Canonical Java Module Entry (ModuleMain.java)\n\`\`\`java\n${t.java_module_example}\n\`\`\`\n\n`;
      }

      if (type === "all" || type === "kotlin_module") {
        output += `## 6. Canonical Kotlin Module Entry (ModuleMainKt.kt)\n\`\`\`kotlin\n${t.kotlin_module_example}\n\`\`\`\n\n`;
      }

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  // Tool 7: Legacy Xposed to Modern LibXposed Migration Guide
  server.tool(
    "migrate_legacy_code",
    "Convert legacy XposedBridge / EdXposed code (e.g., handleLoadPackage, findAndHookMethod, XC_MethodHook, XSharedPreferences) into modern, type-safe LibXposed code.",
    {
      legacySnippet: z.string().optional().describe("Optional legacy code snippet or API name to look up migration guidance for"),
    },
    async ({ legacySnippet }) => {
      let output = `# Legacy Xposed to Modern LibXposed Migration Guide\n\n`;

      if (legacySnippet) {
        const q = legacySnippet.toLowerCase();
        const matched = migrationData.mappings.filter(
          (m) => m.legacy.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q)
        );

        if (matched.length > 0) {
          output += `### Direct Matches for "${legacySnippet}":\n\n`;
          for (const m of matched) {
            output += `- **Legacy API**: \`${m.legacy}\`\n  - **Modern LibXposed**: \`${m.modern}\`\n  - **Notes**: ${m.notes}\n\n`;
          }
          return { content: [{ type: "text", text: output }] };
        }
      }

      output += `### 1:1 Mapping Reference Table\n\n`;
      output += `| Legacy Xposed API | Modern LibXposed Equivalent | Notes |\n`;
      output += `|---|---|---|\n`;
      for (const m of migrationData.mappings) {
        output += `| \`${m.legacy}\` | \`${m.modern}\` | ${m.notes} |\n`;
      }

      output += `\n### Full Migration Transformation Example\n\n`;
      output += `#### Before (Legacy Xposed):\n\`\`\`java\n${migrationData.migrationExample.before}\n\`\`\`\n\n`;
      output += `#### After (Modern LibXposed):\n\`\`\`java\n${migrationData.migrationExample.after}\n\`\`\`\n`;

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  // Tool 8: API Compatibility & Lint Rules
  server.tool(
    "check_api_compatibility",
    "Inspect LibXposed API version requirements (@SinceApi 101 vs 102), breaking changes, and prohibited @InternalApi usage.",
    {
      version: z.enum(["101", "102", "all"]).describe("API version to check features and compatibility for ('101', '102', or 'all')"),
    },
    async ({ version }) => {
      let output = `# LibXposed API Version Compatibility & Annotations\n\n`;

      output += `## Annotations\n`;
      for (const ann of lintData.annotations) {
        output += `### \`${ann.name}\`\n- **Allowed Targets**: ${ann.target.join(", ")}\n- **Rule**: ${ann.doc}\n\n`;
      }

      output += `## Version Specifications\n`;
      const levels = version === "all" ? lintData.apiLevels : lintData.apiLevels.filter((l) => l.version.toString() === version);

      for (const lvl of levels) {
        output += `### ${lvl.name} (API Version ${lvl.version})\n`;
        output += lvl.features.map((f) => "- " + f).join("\n") + "\n\n";
      }

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );

  return server;
}
