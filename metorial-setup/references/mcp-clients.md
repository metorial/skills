# Connect an MCP client to the Metorial admin server

The Metorial admin MCP server is hosted at:

```
https://mcp.metorial.com/mcp
```

- **Transport**: Streamable HTTP
- **Auth**: OAuth 2.1 with dynamic client registration. The client discovers everything from the URL, opens a browser, and the user signs in to Metorial and approves access for one organization. Don't configure headers or API keys.
- **Tools**: one tool per admin operation (400+, grouped by product area), plus `get_account_context`, `instance_list`, `list_endpoints`, `call_endpoint`, and `files_upload`.

If your client can only use local (stdio) servers, bridge it with `npx -y mcp-remote https://mcp.metorial.com/mcp`.

## Claude Code

```bash
claude mcp add --transport http metorial https://mcp.metorial.com/mcp
```

Then run `/mcp` in Claude Code and authenticate `metorial`. Add `--scope user` to make it available in every project.

## Claude Desktop and claude.ai

Settings → Connectors → **Add custom connector** → URL `https://mcp.metorial.com/mcp` → Connect.

## Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "metorial": { "url": "https://mcp.metorial.com/mcp" }
  }
}
```

## VS Code (GitHub Copilot)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "metorial": { "type": "http", "url": "https://mcp.metorial.com/mcp" }
  }
}
```

## OpenAI Codex CLI

```bash
codex mcp add metorial --url https://mcp.metorial.com/mcp
codex mcp login metorial
```

## Gemini CLI

`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "metorial": { "httpUrl": "https://mcp.metorial.com/mcp" }
  }
}
```

## Any other client

Use the URL above with HTTP / Streamable HTTP transport and OAuth. For stdio-only clients:

```json
{
  "mcpServers": {
    "metorial": { "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.metorial.com/mcp"] }
  }
}
```

## Verify the connection

1. Call `get_account_context`. It returns the credential type and the organization, project, instance, actor, and user. The credential itself is never returned.
2. Call `instance_list`. Note the instance IDs. Pass `instance_id` to instance-scoped tools unless the credential is bound to one instance.
3. Make a safe read, for example `providers_list { limit: 5 }`.

## Switch organization

The OAuth grant covers one organization. To work in another, sign out of or remove the server in your client, reconnect, and pick the other organization during sign-in.

## This server vs. Magic MCP servers

`mcp.metorial.com/mcp` *administers* Metorial. The MCP servers you build *with* Metorial for your agents and users are Magic MCP servers, with URLs like `https://api.metorial.com/connect/magic/<alias>`. See [metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md).
