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
          description: `Set to '${ SELF_IDENTIFIER }' to assign to self`,
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
        }
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
