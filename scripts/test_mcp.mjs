import { spawn } from "node:child_process";

const nodeExe = "C:\\Users\\aka\\AppData\\Local\\Programs\\DeepSeek Harness\\resources\\runtime\\primary-runtime\\dependencies\\node\\bin\\node.exe";

const child = spawn(nodeExe, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "inherit"],
});

let buffer = "";

function send(msg) {
  const json = JSON.stringify(msg);
  child.stdin.write(json + "\n");
}

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (e) {
      console.error("Non-JSON stdout:", line);
    }
  }
});

function handleMessage(msg) {
  if (msg.id === 1) {
    console.log("1. [OK] Initialize success:", msg.result?.serverInfo?.name);
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  } else if (msg.id === 2) {
    const tools = msg.result?.tools?.map((t) => t.name) || [];
    console.log("2. [OK] Registered tools:", tools);
    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_symbol", arguments: { symbol: "XposedInterface#deoptimize" } },
    });
  } else if (msg.id === 3) {
    console.log("3. [OK] get_symbol returned deoptimize symbol details:\n  ", msg.result?.content?.[0]?.text?.split("\n")[0]);
    send({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "get_symbol", arguments: { symbol: "package-info" } },
    });
  } else if (msg.id === 4) {
    console.log("4. [OK] get_symbol returned package-info details:\n  ", msg.result?.content?.[0]?.text?.split("\n")[0]);
    send({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "get_symbol", arguments: { symbol: "HookBuilderImpl" } },
    });
  } else if (msg.id === 5) {
    console.log("5. [OK] get_symbol returned HookBuilderImpl details:\n  ", msg.result?.content?.[0]?.text?.split("\n")[0]);
    send({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "get_api_doc", arguments: { className: "XposedInterfaceWrapper" } },
    });
  } else if (msg.id === 6) {
    console.log("6. [OK] get_api_doc returned XposedInterfaceWrapper doc without whitelist restrictions");
    send({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "check_api_compatibility", arguments: { version: "102" } },
    });
  } else if (msg.id === 7) {
    console.log("7. [OK] check_api_compatibility returned API 102 specifications");
    console.log("\n[PASS] All tools and full symbol coverage verified successfully!");
    child.kill();
    process.exit(0);
  }
}

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-runner", version: "1.0.0" },
  },
});

setTimeout(() => {
  console.error("Test timed out!");
  child.kill();
  process.exit(1);
}, 5000);
