import { spawn } from "node:child_process";

const child = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "inherit"],
});

let buffer = "";
let currentId = 0;
const testQueue = [
  // 1. search_libxposed
  { name: "search_libxposed", arguments: { query: "hook" } },
  { name: "search_libxposed", arguments: { query: "RemotePreferences", module: "service" } },
  { name: "search_libxposed", arguments: { query: "HookBuilder", module: "helper" } },
  { name: "search_libxposed", arguments: { query: "SinceApi", module: "lint" } },
  { name: "search_libxposed", arguments: { query: "XC_MethodHook", module: "migration" } },
  { name: "search_libxposed", arguments: { query: "non_existent_symbol_xyz" } },
  // 2. get_api_doc
  { name: "get_api_doc", arguments: { className: "XposedInterface" } },
  { name: "get_api_doc", arguments: { className: "XposedInterface", memberName: "hook" } },
  { name: "get_api_doc", arguments: { className: "XposedInterface", memberName: "API_102" } },
  { name: "get_api_doc", arguments: { className: "XposedModule" } },
  { name: "get_api_doc", arguments: { className: "Chain" } },
  { name: "get_api_doc", arguments: { className: "NonExistentClass" } },
  // 3. get_helper_guide
  { name: "get_helper_guide", arguments: { topic: "all" } },
  { name: "get_helper_guide", arguments: { topic: "hook_builder" } },
  { name: "get_helper_guide", arguments: { topic: "reflector" } },
  { name: "get_helper_guide", arguments: { topic: "kotlin_dsl" } },
  // 4. get_service_guide
  { name: "get_service_guide", arguments: { topic: "all" } },
  { name: "get_service_guide", arguments: { topic: "xposed_service" } },
  { name: "get_service_guide", arguments: { topic: "remote_preferences" } },
  { name: "get_service_guide", arguments: { topic: "hot_reload" } },
  { name: "get_service_guide", arguments: { topic: "direct_boot" } },
  { name: "get_service_guide", arguments: { topic: "aidl" } },
  // 5. get_scaffold
  { name: "get_scaffold", arguments: { type: "all" } },
  { name: "get_scaffold", arguments: { type: "build_gradle" } },
  { name: "get_scaffold", arguments: { type: "manifest" } },
  { name: "get_scaffold", arguments: { type: "proguard" } },
  { name: "get_scaffold", arguments: { type: "entry_list" } },
  { name: "get_scaffold", arguments: { type: "java_module" } },
  { name: "get_scaffold", arguments: { type: "kotlin_module" } },
  // 6. migrate_legacy_code
  { name: "migrate_legacy_code", arguments: {} },
  { name: "migrate_legacy_code", arguments: { legacySnippet: "XSharedPreferences" } },
  { name: "migrate_legacy_code", arguments: { legacySnippet: "findAndHookMethod" } },
  // 7. check_api_compatibility
  { name: "check_api_compatibility", arguments: { version: "all" } },
  { name: "check_api_compatibility", arguments: { version: "101" } },
  { name: "check_api_compatibility", arguments: { version: "102" } },
];

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

let testIndex = 0;
let passedCount = 0;

function runNextTest() {
  if (testIndex >= testQueue.length) {
    console.log(`\n[PASS] Comprehensive verification passed: ${passedCount}/${testQueue.length} test cases passed without a single error!`);
    child.kill();
    process.exit(0);
  }

  const testCase = testQueue[testIndex++];
  currentId++;
  send({
    jsonrpc: "2.0",
    id: currentId,
    method: "tools/call",
    params: testCase,
  });
}

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        // Initialize finished
        send({ jsonrpc: "2.0", method: "notifications/initialized" });
        runNextTest();
      } else if (msg.id > 1) {
        if (msg.error) {
          console.error(`[FAIL] Test failed on item ${testIndex}:`, msg.error);
          child.kill();
          process.exit(1);
        } else {
          passedCount++;
          process.stdout.write(`.` );
          runNextTest();
        }
      }
    } catch (e) {
      console.error("Non-JSON stdout:", line);
    }
  }
});

// Send initialize
send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "deep-recheck-runner", version: "1.0.0" },
  },
});

setTimeout(() => {
  console.error("\n[FAIL] Recheck timed out after 10s!");
  child.kill();
  process.exit(1);
}, 10000);
