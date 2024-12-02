# Linear MCP Server

A Model Context Protocol server for Linear.

## Examples

### Listing issues assigned to me
![Listing assigned issues](https://github.com/user-attachments/assets/11a41e9c-10ed-4cd4-a028-969708a9e389)

### Creating an issue
![Creating an issue](https://github.com/user-attachments/assets/d898e55e-17d2-4a51-82b8-2f291746ebd9)
![Created issue](https://github.com/user-attachments/assets/05761309-f3f4-4945-a7b0-15e98df9aa9d)

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

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "command": "node",
    "args": [
      "/<path-to-folder>/linear-context-server-ts/build/server.js"
    ],
    "env": {
      "LINEAR_API_KEY": <linear-api-key>
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
