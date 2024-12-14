#!/usr/bin/env node

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  TextContent,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { config as dotenvConfig } from "dotenv";
import { Issue, LinearClient } from "@linear/sdk";
import {
  CREATE_COMMENT,
  CREATE_ISSUE,
  getMyIssues,
  handleCreateComment,
  handleCreateIssue,
  handleListIssues,
  handleListTeams,
  LIST_ISSUES,
  LIST_TEAMS,
  SELF_IDENTIFIER,
  TOOLS,
} from "./tools.js";

// Load environment variables
dotenvConfig();
const linearApiKey = process.env.LINEAR_API_KEY;
if (!linearApiKey) {
  throw new Error("LINEAR_API_KEY environment variable is not set");
}

// Initialize Linear client
const linearClient = new LinearClient({
  apiKey: linearApiKey,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);

const server = new Server(
  {
    name: "linear-context-server-ts",
    version: packageJson.version,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

/**
 * Handler for listing available resources.
 * Lists Linear issues assigned to the current user.
 */
server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  const resources = [];

  // Add Linear issues if requested
  if (!request.params?.type || request.params.type === "issue") {
    const issues = await getMyIssues(linearClient);
    const issueResources = issues.map((issue) => ({
      uri: `issue://${issue.id}`,
      mimeType: "application/json",
      name: issue.title,
      description: `Linear issue: ${issue.title} (${issue.identifier})`,
    }));
    resources.push(...issueResources);
  }

  return {
    resources,
  };
});

/**
 * Handler for reading resources.
 * Retrieves and formats Linear issue details.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (!request.params?.uri) {
    throw new Error("URI is required");
  }

  const url = new URL(request.params.uri);

  // Handle Linear issues
  if (url.protocol === "issue:") {
    const issueId = url.hostname;
    const issue = await linearClient.issue(issueId);

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const issueData = {
      title: issue.title,
      id: issue.identifier,
      state: (await issue.state)?.name || "Unknown",
      assignee: (await issue.assignee)?.name || "Unassigned",
      description: issue.description || "No description",
    };

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(issueData, null, 2),
      }],
    };
  }

  throw new Error(`Unsupported resource type: ${url.protocol}`);
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * Handler for calling tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case LIST_ISSUES:
        return await handleListIssues(linearClient);

      case LIST_TEAMS:
        return await handleListTeams(linearClient);

      case CREATE_ISSUE:
        return await handleCreateIssue(
          linearClient,
          request.params.arguments as {
            title: string;
            description?: string;
            assignee?: string;
          },
        );

      case CREATE_COMMENT:
        return await handleCreateComment(
          linearClient,
          request.params.arguments as {
            id: string;
            body: string;
          },
        );

      default:
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linear MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
