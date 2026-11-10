---
name: metorial-sessions
description: Run and debug Metorial tool executions. Covers creating sessions from provider deployments, auth configs, session templates, or integration instances, connecting to a session's MCP URL, calling tools directly from code or the CLI, adding or removing providers on a live session, reusable session templates, and investigating what happened through messages, tool calls, provider runs with logs, events, errors, and error groups. Use this whenever the user wants to execute a Metorial tool programmatically, test a deployment, build a backend that calls tools, or find out why a tool call, Magic MCP server, or agent connection failed, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial sessions

A **session** is where tools run. It combines one or more **session providers** (deployment + config + auth config + tool filters), exposes their tools over MCP, and records every message, tool call, provider run, and error. A **session template** is a saved recipe for creating identical sessions. Integration instances and Magic MCP servers create sessions for you, so this skill is also how you debug them.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-sessions/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-sessions/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`sessions tool-calls create` → `sessions_tool_calls_create`). All commands: [references/commands.md](https://skills.metorial.com/metorial-sessions/references/commands.md).

## Create a session

```bash
metorial-admin sessions create --name "test" \
  --body '{"providers":[{"provider_deployment_id":"<deployment-id>","provider_auth_config_id":"<auth-config-id>"}]}'
```

Each `providers[]` entry takes one of each:

| Part | By ID | Inline |
| --- | --- | --- |
| Deployment | `provider_deployment_id` | `provider_deployment: { provider_id, locked_provider_version_id }` |
| Config | `provider_config_id` | `provider_config: { value }` or `{ provider_config_vault_id }` |
| Auth | `provider_auth_config_id` | `provider_auth_config: { provider_auth_method_id, credentials }` |
| Template | `session_template_id` (instead of the above) | — |

Add `tool_filters` per entry to narrow tools. Prefer IDs: inline auth credentials are secrets and should come from files the user controls.

Other ways to get a session:

- From an integration instance: `integrations instances create-session <instance-id>` ([metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)).
- From a template: `sessions create --body '{"providers":[{"session_template_id":"<id>"}]}'`.
- Magic MCP servers create theirs on first connection: `magic-mcp sessions list --magic-mcp-server-id <id>` → `session_id`.

## Use a session

**Over MCP.** The session's `connection_url` is a Streamable HTTP MCP endpoint. Authenticate with the session's `client_secret` (`metorial_fk_…`, scoped to this session) or an instance API key as a bearer token.

**Direct tool calls**, without an MCP client:

```bash
metorial-admin sessions tool-calls create --session-id <session-id> \
  --tool-id <tool-name> --input '{"query":"is:open label:bug"}'
```

`tool_id` is the tool's name as the session exposes it (what an MCP client sees in `tools/list`). For a template, list the names with `sessions templates list-tools <template-id>`. For a Magic MCP server, use `magic-mcp servers tools <server-id>`. The call waits for the result and returns the tool call with its output and `status` (`succeeded`, `failed`, or `waiting_for_response`).

**Change a live session**: `sessions providers create --session-id <id> …` adds a provider, `sessions providers update <id>` changes its tool filters, `sessions providers delete <id>` removes it.

## Templates

```bash
metorial-admin sessions templates create --name "Support stack" \
  --body '{"providers":[{"provider_deployment_id":"<github>","provider_auth_config_id":"<ac>"},{"provider_deployment_id":"<linear>","provider_config_vault_id":"<vault>"}]}'
metorial-admin sessions templates list-tools <template-id>      # effective tools after all filters
```

Edit with `sessions templates providers create|update|delete`. Template providers take `provider_deployment_id`, `provider_config_id` or `provider_config_vault_id`, `provider_auth_config_id`, and `tool_filters`.

## Debug a failure

Work from the outside in:

1. **Find the session.** `sessions list` filters by status, provider, deployment, auth config, identity, and more. Sessions with problems have `has_errors` / `has_warnings` set. For Magic MCP servers, start from `magic-mcp sessions list`.
2. **Find the call.** `sessions tool-calls list --session-id <id> --status failed`. `tool-calls list` without a session searches across all sessions (by provider, deployment, identity actor, consumer, tool, or status).
3. **Read the error.** `sessions errors list --session-id <id>`, and `sessions error-groups list` for recurring errors grouped across sessions.
4. **Read the provider's side.** `sessions runs list --session-id <id>`, then `sessions runs get-logs <run-id>` for the provider's own output (stack traces, upstream HTTP errors).
5. **Replay the protocol.** `sessions messages list <session-id>` shows the raw MCP exchange. `sessions events list` shows lifecycle events. `sessions connections list` and `sessions participants list` show who was connected.

Typical causes:

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Tool missing | Tool filters at some layer, or the auth method doesn't support the tool | `templates list-tools` / `magic-mcp servers tools`; [filter layering](https://skills.metorial.com/metorial-integrations/references/resources.md#tool-filter-layering) |
| 401/403 from the upstream service | Auth config expired or revoked, or missing scopes | Rerun a setup session ([metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md#connect-an-account-auth-config)) |
| Config validation errors | Config doesn't match the provider's schema | `providers configs get-config-schema` |
| Run crashes on start | Custom provider bug | Run logs, then [metorial-custom-providers](https://skills.metorial.com/metorial-custom-providers/SKILL.md) |

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-sessions/references/resources.md): session, session provider, template, and every recorded child resource
- [references/commands.md](https://skills.metorial.com/metorial-sessions/references/commands.md): generated CLI ↔ MCP table
