import { createLibXposedServer } from "./server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-id",
};

const activeSessions = new Map<string, (data: string) => void>();

async function processJsonRpc(msg: any): Promise<any> {
  return new Promise((resolve) => {
    let resolved = false;
    const server = createLibXposedServer();

    const transport: any = {
      start: async () => {},
      send: async (responseMsg: any) => {
        if (!resolved) {
          resolved = true;
          resolve(responseMsg);
        }
      },
      close: async () => {},
    };

    server
      .connect(transport)
      .then(() => {
        transport.onmessage?.(msg);
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({
              jsonrpc: "2.0",
              id: msg?.id ?? null,
              error: { code: -32603, message: "Internal execution timeout" },
            });
          }
        }, 8000);
      })
      .catch((err: any) => {
        resolve({
          jsonrpc: "2.0",
          id: msg?.id ?? null,
          error: { code: -32603, message: String(err) },
        });
      });
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. SSE Connection: GET /sse
    if (request.method === "GET" && (url.pathname === "/sse" || url.pathname.endsWith("/sse"))) {
      const sessionId = crypto.randomUUID();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const sendEvent = async (event: string, data: string) => {
        try {
          await writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          activeSessions.delete(sessionId);
        }
      };

      activeSessions.set(sessionId, (data: string) => {
        sendEvent("message", data);
      });

      // Send standard endpoint discovery event
      sendEvent("endpoint", `/message?sessionId=${sessionId}`);

      return new Response(readable, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 2. JSON-RPC Message: POST /message or /mcp or /
    if (request.method === "POST") {
      try {
        const bodyText = await request.text();
        const jsonMsg = JSON.parse(bodyText);

        const rpcResult = await processJsonRpc(jsonMsg);

        // If there is an active SSE session attached, also push down the stream
        const sessionId = url.searchParams.get("sessionId") || request.headers.get("x-session-id");
        if (sessionId && activeSessions.has(sessionId)) {
          const push = activeSessions.get(sessionId);
          push?.(JSON.stringify(rpcResult));
        }

        return new Response(JSON.stringify(rpcResult), {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error: " + String(err) },
            id: null,
          }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // 3. Fallback info dashboard
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>LibXposed MCP Server</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    h1 { color: #0284c7; }
    code { background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    .badge { display: inline-block; background: #22c55e; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.8em; font-weight: bold; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <h1>LibXposed MCP Server <span class="badge">ONLINE</span></h1>
  <p>Full-spectrum Model Context Protocol (MCP) server for modern LibXposed Android hooking framework.</p>
  
  <h2>🔗 Connection Endpoint</h2>
  <p>Use the root URL with modern <code>streamable-http</code> transport:</p>
  <ul>
    <li><strong>Streamable HTTP URL (Root):</strong> <code>https://${url.host}</code></li>
    <li><strong>Transport Type:</strong> <code>streamable-http</code></li>
  </ul>

  <h2>🛠️ Registered Tools (All 7 Available)</h2>
  <ul>
    <li><code>search_libxposed</code>: Universal search across api, helper, service, lint, example, migration</li>
    <li><code>get_api_doc</code>: Deep dive into class/method signatures and Javadoc links</li>
    <li><code>get_helper_guide</code>: HookBuilder, Reflector, and Kotlin DSL</li>
    <li><code>get_service_guide</code>: RemotePreferences, XposedService, Hot Reload, and Direct Boot</li>
    <li><code>get_scaffold</code>: build.gradle.kts, AndroidManifest, ProGuard, java_init.list</li>
    <li><code>migrate_legacy_code</code>: 1:1 mapping from legacy XposedBridge to LibXposed</li>
    <li><code>check_api_compatibility</code>: API 101/102 features and @InternalApi checks</li>
  </ul>

  <h2>⚙️ Recommended MCP Configuration (DSH, Cursor, Windsurf, Claude)</h2>
  <pre>{
  "mcpServers": {
    "libxposed": {
      "url": "https://${url.host}",
      "transport": "streamable-http"
    }
  }
}</pre>
</body>
</html>`,
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  },
};
