#!/usr/bin/env node

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

// Load environment variables
dotenvConfig();
const linearApiKey = process.env.LINEAR_API_KEY;
if (!linearApiKey) {
  throw new Error("LINEAR_API_KEY environment variable is not set");
}

// Tools
const CREATE_ISSUE = "create_issue";
const LIST_ISSUES = "list_issues";
const TOOLS: Tool[] = [
  {
    name: CREATE_ISSUE,
    description: "Create a new Linear issue",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: LIST_ISSUES,
    description: "List all Linear issues assigned to me",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Initialize Linear client
const linearClient = new LinearClient({
  apiKey: linearApiKey,
});

async function getMyIssues() {
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  return myIssues.nodes;
}

const server = new Server(
  {
    name: "linear-context-server-ts",
    version: "0.1.0",
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
    const issues = await getMyIssues();
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
  const name = request.params.name;

  switch (name) {
    case LIST_ISSUES: {
      const issues = await getMyIssues();
      const issuesData = await Promise.all(
        issues.map(async (issue) => ({
          id: issue.identifier,
          title: issue.title,
          state: (await issue.state)?.name || "Unknown",
          url: issue.url,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(issuesData, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case CREATE_ISSUE: {
      const args = request.params.arguments as {
        title: string;
        description?: string;
      };
      const { title, description } = args;

      // Get the default team to create the issue in
      const teams = await linearClient.teams();
      const team = teams.nodes[0]; // Use first team

      if (!team) {
        throw new Error("No team found to create issue in");
      }

      // Create the issue
      const response = await linearClient.createIssue({
        title,
        description,
        teamId: team.id,
      });

      // Return the created issue data
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Error: Unknown tool: ${name}`,
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
