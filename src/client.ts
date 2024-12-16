#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const words = {
  adjectives: [
    "Innovative",
    "Dynamic",
    "Strategic",
    "Seamless",
    "Robust",
    "Intuitive",
    "Scalable",
    "Efficient",
  ],
  verbs: [
    "Implement",
    "Optimize",
    "Enhance",
    "Develop",
    "Refactor",
    "Design",
    "Integrate",
    "Deploy",
  ],
  nouns: [
    "Architecture",
    "Framework",
    "Solution",
    "Platform",
    "System",
    "Interface",
    "Component",
    "Pipeline",
  ],
};

function generateRandomTitle() {
  const adj =
    words.adjectives[Math.floor(Math.random() * words.adjectives.length)];
  const verb = words.verbs[Math.floor(Math.random() * words.verbs.length)];
  const noun = words.nouns[Math.floor(Math.random() * words.nouns.length)];
  return `${verb} ${adj} ${noun}`;
}

async function main() {
  let serverProcess;
  let transport;
  let client;

  try {
    // Start the server process
    const serverPath = path.join(__dirname, "server.js");
    serverProcess = spawn("node", [serverPath]);

    // Create a transport that communicates with the server process
    transport = new StdioClientTransport({
      command: serverPath,
      args: [],
    });

    // Create the client and connect
    client = new Client(
      {
        name: "linear-context-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          experimental: {},
          sampling: {},
          roots: {},
        },
      },
    );
    await client.connect(transport);

    // List available tools
    console.log("\nListing available tools:");
    const tools = await client.listTools();
    console.log(tools);

    // List all Linear issues
    console.log("\nListing assigned Linear issues:");
    const resources = await client.listResources({ type: "issue" });
    console.log(resources);

    // Test list_issues tool
    console.log("\nTesting list_issues tool:");
    const listResult = await client.callTool({
      name: "list_issues",
      arguments: {},
    });
    console.log(listResult);

    // Test list_teams tool
    console.log("\nTesting list_teams tool:");
    const teamsResult = await client.callTool({
      name: "list_teams",
      arguments: {},
    });
    console.log(teamsResult);

    // Create a test issue
    const create_issue = false;
    if (create_issue) {
      console.log("\nCreating a test issue:");
      const createResult = await client.callTool({
        name: "create_issue",
        arguments: {
          title: generateRandomTitle(),
          description:
            "This is a test issue created via the Model Context Protocol",
        },
      });
      console.log("\nCreated a test issue:");
      console.log(createResult);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.error("Error closing transport:", e);
      }
    }

    if (serverProcess) {
      serverProcess.kill();
      process.exit(0);
    }
  }
}

// Add error handling for uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Client error:", error);
  process.exit(1);
});
