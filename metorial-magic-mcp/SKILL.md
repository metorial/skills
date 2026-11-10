---
name: metorial-magic-mcp
description: Give agents and MCP clients a permanent, hosted MCP URL through Metorial Magic MCP. Covers creating Magic MCP servers from an integration instance, a portal provider template, or manually from provider deployments, combining servers behind one endpoint URL, grouping servers, creating and scoping Magic MCP tokens, connecting clients such as Claude, Cursor, or agent SDKs, checking which tools a server exposes, and inspecting its sessions. Use this whenever the user wants an MCP URL, server, or connector for their agent, wants to combine tools from several services into one MCP server, needs to authorize or revoke a client's access, or asks why tools are missing on a Metorial MCP server, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial Magic MCP

A **Magic MCP server** is a permanent MCP URL backed by a session template. Metorial creates the underlying session on the first connection and reuses it, with every call traced. **Endpoints** put several servers behind one URL, **groups** bundle servers for access, and **tokens** authorize clients.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-magic-mcp/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-magic-mcp/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`magic-mcp servers create` → `magic_mcp_servers_create`). Token creation and reading token secrets are **CLI only**. All commands: [references/commands.md](https://skills.metorial.com/metorial-magic-mcp/references/commands.md).

Not to be confused with the admin server `mcp.metorial.com/mcp`, which administers Metorial itself.

## Create a server

Pick the source of its providers:

| From | Command | When |
| --- | --- | --- |
| Integration instance | `magic-mcp servers create --integration-instance-id <id> --name "…"` | Governed setups. The account is connected, tool filters are approved. Recommended. |
| Portal provider template | `magic-mcp servers create --provider-template-id <id> [--consumer-profile-id <id>]` | Portal catalog items, usually created by consumers themselves |
| Manual | `magic-mcp servers create --name "…"`, then add providers | Quick setups straight from deployments and auth configs |

Manual providers:

```bash
metorial-admin magic-mcp servers providers create <server-id> --provider-id <provider-id> \
  --provider-deployment-id <deployment-id> --provider-auth-config-id <auth-config-id> \
  --body '{"tool_filters":[{"type":"tool_regex","pattern":"^(list|get)_"}]}'
```

Add one row per provider. Each row can carry its own config, auth config, and tool filters. The server's `provider_management_mode` (`manual`, `inherited_from_integration`, `inherited_from_provider_template`) shows where its providers come from. Inherited servers follow their integration instance or provider template, so change those instead.

## Get the URL and check the tools

```bash
metorial-admin magic-mcp servers get <server-id>       # endpoints[].url, endpoints[].alias
metorial-admin magic-mcp servers tools <server-id>     # the effective tools after all filters
```

The URL looks like `https://api.metorial.com/connect/magic/<alias>`. Servers in a portal get the portal's connect URL. Add or replace aliases with `magic-mcp servers update <id> --body '{"aliases":["acme-github"]}'`.

## Authorize clients

```bash
metorial-admin magic-mcp tokens create --name "support-agent" --magic-mcp-server-id <server-id>
```

- A token links to **one server or one endpoint** (not both), plus any number of groups via `--magic-mcp-group-ids`. Linking both a server and an endpoint fails with `precondition_failed`.
- The response contains the `secret`. Hand it to the user's secret store. Don't print it back into the conversation or commit it.
- Instance API keys (`metorial_sk_…`, `metorial_pk_…`) also authenticate, for code you control.
- Rename with `tokens update`, change groups with `tokens add-groups` / `remove-groups`, and revoke with `tokens delete` (immediate; confirm first).

Without the CLI, ask the user to create the token in the dashboard or to run the command above themselves.

## Connect a client

Send the secret as a bearer token, or as `?key=<secret>` when the client can't set headers.

```bash
# Claude Code
claude mcp add --transport http acme-github https://api.metorial.com/connect/magic/<alias> \
  --header "Authorization: Bearer $METORIAL_MAGIC_TOKEN"
```

```json
{ "mcpServers": { "acme-github": {
    "url": "https://api.metorial.com/connect/magic/<alias>",
    "headers": { "Authorization": "Bearer ${METORIAL_MAGIC_TOKEN}" } } } }
```

Transport is Streamable HTTP. For stdio-only clients use `npx -y mcp-remote <url> --header "Authorization: Bearer …"`.

## One URL for several servers: endpoints

```bash
metorial-admin magic-mcp endpoints create --name "Support agent" \
  --body '{"magic_mcp_servers":[{"magic_mcp_server_id":"<github>"},{"magic_mcp_server_id":"<linear>","tool_filters":{"type":"tool_keys","keys":["list_issues"]}}]}'
metorial-admin magic-mcp tokens create --name "support-agent" --magic-mcp-endpoint-id <endpoint-id>
```

- The endpoint's `url` combines the tools of every listed server, each optionally narrowed further. Use `--use-integration-name-in-tool-names` on integrations to avoid tool name clashes.
- Change membership with `endpoints add-servers` / `remove-servers`.

## Groups

```bash
metorial-admin magic-mcp groups create --name "Engineering"
metorial-admin magic-mcp groups add-servers <group-id> --magic-mcp-server-ids <id1>,<id2>
```

A token with a group reaches every server in it, including servers added later. A group can't be deleted while it is the only group of an active token, so that deleting never widens a token's access.

## Debug

- **Missing tools**: run `magic-mcp servers tools <id>`, then check tool filters on the server provider, endpoint, integration provider, and instance ([metorial-integrations](https://skills.metorial.com/metorial-integrations/references/resources.md#tool-filter-layering)).
- **Calls fail**: `magic-mcp sessions list --magic-mcp-server-id <id>`, then inspect the underlying session's tool calls and errors ([metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md)).
- **401 from the URL**: the token was deleted, or it is bound to a different server or endpoint.
- **Expired account**: rerun an integration setup session with `--integration-instance-id` ([metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)).

`magic-mcp servers delete <id>` archives the server and its URL stops working. Confirm first.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-magic-mcp/references/resources.md): server, server provider, endpoint, group, token, Magic MCP session
- [references/commands.md](https://skills.metorial.com/metorial-magic-mcp/references/commands.md): generated CLI ↔ MCP table
