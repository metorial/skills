# Magic MCP resources

```
Magic MCP server ── session template ── Magic MCP session (created on first connect, reused)
 ├ Server provider rows (manual mode)      provider + deployment + config + auth config + tool filters
 └ endpoints[] (alias → URL)
Magic MCP endpoint ── many servers (each with tool filters) ── one URL
Magic MCP group ── many servers
Magic MCP token ── one server OR one endpoint, + groups
```

## Magic MCP server

| Field | Meaning |
| --- | --- |
| `status` | `active`, `archived`, `deleted` |
| `provider_management_mode` | `manual`, `inherited_from_integration`, `inherited_from_provider_template` |
| `source` | `manual`, `consumer_provider_template` (made by a portal consumer), `explorer` |
| `endpoints[]` | `{ id, alias, url }`. Each alias is a connect URL. Set aliases with `update`. |
| `provider_template_id` | Set for template-backed servers |
| `providers[]` | The backing provider rows |
| `access` | Ownership (`public` / `owner_locked`, visibility, owner) |

Create inputs: `name`, plus at most one of `integration_instance_id`, `provider_template_id`, or (with a template) `consumer_profile_id`. `delete` archives the server and its URLs stop resolving.

Under the hood, Metorial keeps every server backed by an integration. Manual provider rows create a backing integration provider and integration instance provider, and deleting a row removes the shared integration provider when nothing else uses it.

## Server provider (manual mode)

`provider_id` (required), `provider_deployment_id`, `provider_config_id`, `provider_auth_config_id`, `tool_filters`. Update and delete it with the server ID and the row ID.

## Magic MCP endpoint

| Field | Meaning |
| --- | --- |
| `magic_mcp_servers[]` | `{ magic_mcp_server_id, tool_filters }` |
| `url` | Connect URL (`/connect/magic/<slug>`, or the portal connect URL) |
| `consumer_profile_id` | Owning consumer profile, for portal endpoints |

## Magic MCP group

`name`, plus member servers (`add-servers`, `remove-servers`). A token's access through a group follows membership changes. Delete fails while the group is the only group of an active token.

## Magic MCP token

| Field | Meaning |
| --- | --- |
| `status` | `active`, `deleted` |
| `secret` | Returned on create and by `tokens get` / `list` in the CLI. Never exposed through the admin MCP server. |
| `server` / `endpoint` | At most one of them |
| `groups[]` | Additional servers reachable through groups |

Create with the CLI only (`--name` required). Update the name, description, and metadata, change groups, or delete (revokes immediately).

Clients send the secret as `Authorization: Bearer <secret>` or `?key=<secret>`. Instance API keys also authenticate.

## Magic MCP session

The runtime behind a server or endpoint connection: `magic_mcp_server` or `magic_mcp_endpoint`, `session_id` (the underlying [session](https://skills.metorial.com/metorial-sessions/SKILL.md), where tool calls, runs, and errors live), `consumer_profile_id`, and `expires_at`. List them per server with `magic-mcp sessions list --magic-mcp-server-id <id>`.
