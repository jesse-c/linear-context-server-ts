import { LinearClient } from "@linear/sdk";
import {
  CallToolResult,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";

// Names
export const CREATE_ISSUE = "create_issue";
export const CREATE_COMMENT = "create_comment";
export const LIST_ISSUES = "list_issues";
export const LIST_TEAMS = "list_teams";

export const SELF_IDENTIFIER = "me";

// Definitions
export const TOOLS = [
  {
    name: CREATE_ISSUE,
    description: "Create a new Linear issue.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the issue",
        },
        description: {
          type: "string",
          description: "Description of the issue",
        },
        assignee: {
          type: "string",
          description: `Set to '${SELF_IDENTIFIER}' to assign to self`,
        },
      },
      required: ["title"],
    },
  },
  {
    name: CREATE_COMMENT,
    description: "Create a new comment on an existing Linear issue.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the existing Linear issue.",
        },
        body: {
          type: "string",
          description: "Body of the comment",
        },
      },
      required: ["id", "body"],
    },
  },
  {
    name: LIST_ISSUES,
    description: "List all Linear issues assigned to me.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: LIST_TEAMS,
    description: "List all Linear teams I have access to.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export async function getMyIssues(linearClient: LinearClient) {
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  return myIssues.nodes;
}

export async function handleListIssues(
  linearClient: LinearClient,
): Promise<CallToolResult> {
  const issues = await getMyIssues(linearClient);
  const issuesData = await Promise.all(
    issues.map(async (issue) => ({
      id: issue.identifier,
      title: issue.title,
      state: (await issue.state)?.name || "Unknown",
      url: issue.url,
    })),
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(issuesData, null, 2),
      } as TextContent,
    ],
    isError: false,
  };
}

export async function handleListTeams(
  linearClient: LinearClient,
): Promise<CallToolResult> {
  const me = await linearClient.viewer;
  const teams = await me.teams();

  const teamsData = await Promise.all(
    teams.nodes.map(async (team) => ({
      id: team.id,
      name: team.name,
      key: team.key,
    })),
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(teamsData, null, 2),
      } as TextContent,
    ],
    isError: false,
  };
}

export async function handleCreateIssue(
  linearClient: LinearClient,
  args: {
    title: string;
    description?: string;
    assignee?: string;
  },
): Promise<CallToolResult> {
  const { title, description, assignee } = args;

  let assigneeId: string | undefined;
  if (assignee === SELF_IDENTIFIER) {
    const me = await linearClient.viewer;
    assigneeId = me.id;
  }

  const me = await linearClient.viewer;
  const teams = await me.teams();
  const team = teams.nodes[0];

  if (!team) {
    throw new Error("No team found to create issue in");
  }

  const response = await linearClient.createIssue({
    title: title,
    description: description,
    assigneeId: assigneeId,
    teamId: team.id,
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      } as TextContent,
    ],
    isError: false,
  };
}

export async function handleCreateComment(
  linearClient: LinearClient,
  args: {
    id: string;
    body: string;
  },
): Promise<CallToolResult> {
  const { id, body } = args;

  const issue = await linearClient.issue(id);
  if (!issue) {
    throw new Error(`Issue ${id} not found`);
  }

  const response = await linearClient.createComment({
    issueId: issue.id,
    body: body,
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      } as TextContent,
    ],
    isError: false,
  };
}
