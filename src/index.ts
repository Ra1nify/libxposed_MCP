#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLibXposedServer } from "./server.js";

async function main() {
  const server = createLibXposedServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error running libxposed-mcp:", error);
  process.exit(1);
});
