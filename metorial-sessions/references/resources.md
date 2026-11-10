# Session resources

```
Session template ── template providers (deployment, config | vault, auth config, tool filters)
      │ creates
Session (status active | archived; connection_state connected | disconnected)
├─ Session provider      deployment + config + auth config + tool filters (+ template)
├─ Connection            one client connection (MCP, or the internal tool-call transport)
├─ Participant           a client or provider taking part
├─ Message               each MCP protocol message, with hierarchy and status
├─ Tool call             one tool invocation: tool, input, output, status
├─ Provider run          one execution of a provider for this session → logs
├─ Event                 lifecycle events
└─ Error                 a failure, grouped across sessions into error groups
```

## Session

| Field | Meaning |
| --- | --- |
| `status` | `active`, `archived`, `deleted` |
| `connection_state` | `connected`, `disconnected` |
| `connection_url` | MCP endpoint for this session (Streamable HTTP) |
| `client_secret` | `metorial_fk_…`, a credential scoped to this session only. Treat it as a secret. |
| `providers[]` | Session providers |
| `from_template_ids` | Templates it was created from |
| `has_errors`, `has_warnings` | Quick health flags |
| `identity_id`, `identity_actor_id` | Whose identity it runs as, if any |
| `usage` | Productive client and provider message counts |

Created by `sessions create`, `integrations instances create-session`, or automatically by Magic MCP servers. Only `name` and `metadata` are updatable. Providers change through session providers.

## Session provider

Inputs: `provider_deployment_id` or inline `provider_deployment`, `provider_config_id` or inline `provider_config`, `provider_auth_config_id` or inline `provider_auth_config`, `session_template_id`, and `tool_filters`. On a live session you can add (`sessions providers create`), change filters (`update`), and remove (`delete`) providers.

## Session template

`name` plus template providers. Template providers can reference a config vault (`provider_config_vault_id`), so each session gets a fresh config built from it. `list-tools` returns the effective tools after the filters of each provider, deployment, config, and auth config. Integration instances keep a shared template (`integrations instances create-session-template`), and Magic MCP servers are backed by one.

## Tool call

| Field | Meaning |
| --- | --- |
| `status` | `waiting_for_response`, `succeeded`, `failed` |
| tool | The tool's key and name |
| input / output | What was sent and returned |

`sessions tool-calls create { session_id, tool_id, input }` invokes a tool directly and waits for the result. `tool_id` is the tool name the session exposes. `tool-calls list` searches across all sessions, filterable by session, template, provider, deployment, config, auth config, identity, actor, agent, consumer, tool, and status.

## Provider run

One execution of a provider (a process or connection for a session provider): status, provider version, connection. `get-logs` returns the provider's stdout/stderr, the first place to look for crashes and upstream HTTP errors.

## Errors and error groups

An **error** records a failure with its `type`, code, message, and links to the message, run, connection, and session provider. **Error groups** cluster the same error across sessions. Use them to spot systemic problems (an expired OAuth app, a broken provider version).

## Messages, events, connections, participants

Raw material for deep debugging: the exact MCP exchange (`messages`, filterable by type, source, status, participant, run), lifecycle `events`, the client `connections`, and the `participants` involved.
