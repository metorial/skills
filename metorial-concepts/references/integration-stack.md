# The integration stack

How a third-party service, or your own MCP server, becomes a URL an agent can connect to. Each layer references the one below it by ID.

```
Provider ───────────── what is possible                    providers_get
 ├ Provider version        tools, triggers, auth methods, config schema
 ├ Provider listing        provider + marketplace metadata (catalog view)
 └ (Custom provider) ──── your MCP server; each successful build = new provider version
        │
Provider deployment ──── runnable: provider + pinned version + default config
 ├ Provider config         non-secret settings (or from a config vault)
 ├ Provider auth credentials  your OAuth app (client ID / secret / scopes)
 └ Provider auth config    one user's connection (OAuth token, API key)
        │
Integration ──────────── approved, versioned bundle
 └ Integration provider    deployment + auth method/credentials + config + tool filters (+ callbacks)
        │
Integration instance ─── the bundle bound to an owner (actor or identity), with their config + auth config
        │
 ┌──────┴───────────────┐
Session template         Magic MCP server ── stable MCP URL; reuses one session on demand
 └ Session                ├ Magic MCP endpoint   several servers behind one URL
   └ tool calls, runs,    ├ Magic MCP group      servers grouped for token access
     messages, errors     └ Magic MCP token      bearer secret for /connect/magic
```

You can enter at different layers. A quick prototype can create a session straight from a deployment. A governed setup goes through integrations and Magic MCP servers.

## Provider

A read-only definition of an MCP integration: GitHub, Slack, Linear, or your custom provider.

- **Versions** pin behavior. Each version has its own tools, auth methods, and config schema (its *specification*).
- **Tools** are the callable actions (`search_issues`). **Triggers** are the events it can emit for callbacks.
- **Auth methods** say how to authenticate: OAuth, API token, or custom credentials. One version can offer several.
- **Listings, categories, collections, publishers** are catalog metadata for browsing. **Provider groups** are your own folders.

Skill: [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)

## Custom provider

Your own MCP server, of type `container` (image), `remote` (URL you host), or `function` (code Metorial runs).

- Creating a **custom provider version** starts a **custom provider deployment**, a build and discovery job (`queued → deploying → succeeded | failed`). Success yields a normal **provider version**.
- **Environments** are the custom provider's presence in each instance (staging, production), and each has a current version. **Commits** promote a version from one environment to another (`merge_version_into_environment`) or roll one back (`rollback_commit`).
- Once built, it is a provider like any other. Deploy it, put it in integrations, serve it through Magic MCP.

Skill: [metorial-custom-providers](https://skills.metorial.com/metorial-custom-providers/SKILL.md)

## Provider deployment

A provider made runnable: `provider_id`, an optional `locked_provider_version_id` (null follows the latest), an optional default `provider_config`, and optional `tool_filters`.

Auth is attached around it:

| Resource | Holds | Created by |
| --- | --- | --- |
| Provider config | Non-secret settings (region, base URL, flags) | Inline value, or from a **config vault** (saved reusable values, including secret ones) |
| Provider auth credentials | Your OAuth app: client ID, secret, scopes | You, from the service's developer console |
| Provider auth config | One user's connection: OAuth tokens or a pasted key | A **provider setup session** (OAuth redirect or form), or a direct create |

Skill: [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)

## Integration

An approved, reusable package of one or more **integration providers**. Each integration provider fixes:

- `provider_id` and `provider_deployment_id` (required)
- `provider_auth_method_id`, `provider_auth_credentials_id`, `provider_config_id` (optional defaults)
- `tool_filters`: which tools are allowed
- `callbacks.status`: whether provider triggers are delivered as callback events

Integration settings control what instances may change: `can_attach_custom_tool_filters`, `can_attach_custom_provider_config`, `can_override_tool_filters`, `use_integration_name_in_tool_names`, `enable_callback_tools`.

Integrations and integration providers are versioned. Every change creates a new version, and existing instances keep resolving cleanly.

Skill: [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)

## Integration instance

An integration materialized for one owner, with that owner's config and auth.

- Owner: `identity_actor_id` (a person or agent) and/or `identity_id`.
- `providers[]`: per provider, a `provider_config_id`, `provider_auth_config_id`, and (if allowed) `tool_filters`.
- Usually created through an **integration setup session**. It returns a hosted URL where the user connects each provider (OAuth or form). When the session reaches `successful`, the draft instance becomes active.
- Statuses: `draft → active → archived`.
- From an instance: `integrations_instances_create_session` starts a session, and `integrations_instances_create_template` creates or updates its shared session template. Pass `integration_instance_id` to `magic_mcp_servers_create` to serve it as a Magic MCP server.

Skill: [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)

## Session and session template

A **session** is the runtime where tools execute. It has one or more **session providers**. Each one references (or inline-creates) a deployment, config, and auth config, with optional tool filters.

- Clients connect through **session connections**. **Participants** are the clients and providers involved.
- Every exchange is recorded: **messages** (MCP protocol), **tool calls** (input, output, status), **provider runs** (execution with logs), **events**, **errors**, and **error groups**.
- `sessions_tool_calls_create { session_id, tool_id, input }` calls a tool directly, without an MCP client.

A **session template** is a saved recipe (template providers with deployment, config or vault, auth config, tool filters) for creating consistent sessions. Integration instances and Magic MCP servers are backed by templates.

Skill: [metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md)

## Magic MCP server

A permanent, hosted MCP entrypoint backed by a session template. Metorial creates a **Magic MCP session** on first connection and reuses it.

Ways to create one (`provider_management_mode` records which):

| Mode | Create with | Providers come from |
| --- | --- | --- |
| `inherited_from_integration` | `magic_mcp_servers_create { integration_instance_id }` | The integration instance |
| `inherited_from_provider_template` | `{ provider_template_id }` (portal catalog item) | The portal's provider template |
| `manual` | `{ name }`, then `magic_mcp_servers_providers_create` | Server provider rows you add (provider + deployment + config + auth config + tool filters) |

Around servers:

- **Endpoints** route several servers behind one URL, with per-server tool filters.
- **Groups** collect servers. Tokens bound to a group reach every server in it.
- **Tokens** authorize clients. Each token links to at most one server *or* one endpoint, plus any number of groups. The secret is sent as `Authorization: Bearer <secret>` or `?key=<secret>`.
- Each server has `endpoints[]` with an `alias` and a `url` like `https://api.metorial.com/connect/magic/<alias>`. Portal endpoints get portal-branded URLs.

Skill: [metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md)

## Picking an entry point

| Situation | Path |
| --- | --- |
| Backend code calls tools on behalf of one service account | Deployment → session (or template) → tool calls |
| An MCP client (Claude, Cursor, an agent framework) needs tools | Deployment → integration → instance → Magic MCP server → token |
| Many users each connect their own accounts | Integration → setup session per user (or a portal) → instance per user → Magic MCP server per instance |
| Self-serve catalog for employees or customers | Integration → portal access for consumer groups. Consumers connect through the portal or `metorial` CLI. |
| Your own MCP server | Custom provider → then any of the above |
