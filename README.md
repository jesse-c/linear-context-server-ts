# Linear MCP Server

A Model Context Protocol server for Linear.

## Tools
> [!IMPORTANT]
> * means required.

### `create_issue`
Create a new Linear issue.

**Parameters**

- `title` (string*): Title of the issue
- `description` (string): Description of the issue
- `assignee` (string): Set to 'me' to assign to self

### `create_comment`
Create a new comment on an existing Linear issue.

**Parameters**

- `id` (string*): ID of the existing Linear issue.
- `body` (string*): Body of the comment

### `list_issues`
List all Linear issues assigned to me.

**Parameters**

N/A

### `list_teams`
List all Linear teams I have access to.

**Parameters**

N/A

## Examples

### Listing issues assigned to me
![Listing assigned issues](https://github.com/user-attachments/assets/11a41e9c-10ed-4cd4-a028-969708a9e389)

### Creating an issue
![Creating an issue](https://github.com/user-attachments/assets/d898e55e-17d2-4a51-82b8-2f291746ebd9)
![Created issue](https://github.com/user-attachments/assets/05761309-f3f4-4945-a7b0-15e98df9aa9d)

## How to use

To use with Claude Desktop, add the server config.

### Linear API key

You can create a Personal API Key at [https://linear.app/your-team-name/settings/account/security](https://linear.app/<team>/settings/account/security). Remember to replace `your-team-name` with the correct value.

### Automatic

> [!TIP]
> `.env` files are supported.

```shell
LINEAR_API_KEY=<your-linear-api-key> npm run configure [--force] [--name=<server-name>]
```

### Manual

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "linear-context-server": {
      "command": "node",
      "args": [
        "/<path-to-folder>/linear-context-server/build/server.js"
      ],
      "env": {
        "LINEAR_API_KEY": <your-linear-api-key>
      }
    }
  }
}
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
