# Conventions shared by every command and tool

These rules apply to all `metorial-admin` commands and all Metorial admin MCP tools.

## Command ↔ tool mapping

The CLI and the MCP server are generated from one API definition (`mt_2026_01_01_magnetar`):

| CLI | MCP |
| --- | --- |
| `metorial-admin custom-providers versions create --custom-provider-id cp_1` | `custom_providers_versions_create { custom_provider_id: "cp_1" }` |
| `metorial-admin skills files get <skill-id> --path /SKILL.md` | `skills_files_get { skill_id, path: "/SKILL.md" }` |
| `--instance inst_1` (global flag) | `instance_id: "inst_1"` (input on every instance-scoped tool) |

Rule: tool name = command path joined with `_`, with hyphens replaced by `_`. Inputs are snake_case versions of positional arguments and flags. One exception: `integrations instances create-session-template` is `integrations_instances_create_template`.

## Output

- CLI: `--format json` for machine-readable output. `structured` (the default) is for people. Set a default with `metorial-admin cli settings set default-format json`.
- MCP: tools return JSON.
- Every object has an `object` field naming its type (for example `magic_mcp.server`) and an `id`.

## Lists and pagination

List responses look like:

```json
{ "object": "list", "items": [ ... ], "pagination": { "has_more_after": true, "has_more_before": false } }
```

| Input | Meaning |
| --- | --- |
| `limit` | Page size |
| `after` | Return items after this ID (next page: pass the last item's `id`) |
| `before` | Return items before this ID |
| `order` | `asc` or `desc` |
| `id`, `status`, `<parent>_id` … | Filters. Most list commands accept repeatable ID filters, for example `--provider-id a --provider-id b`. |

CLI: `metorial-admin sessions list --limit 50 --after sess_abc`. MCP: `sessions_list { limit: 50, after: "sess_abc" }`.

Keep paging while `has_more_after` is `true`. Filter on the server instead of fetching everything.

## Request bodies

Simple fields have flags (`--name`, `--provider-id`). Nested fields (arrays of providers, tool filters, configs) go in a JSON body:

```bash
metorial-admin sessions create --body '{"providers":[{"provider_deployment_id":"pd_123"}]}'
metorial-admin integrations providers create --body-file integration-provider.json
cat body.json | metorial-admin sessions templates create --body-file -
```

- `--body` / `--body-file` take a JSON object that is merged into the request body. Flags still apply.
- Flags typed as JSON (for example `--config`) take a JSON string.
- MCP tools take the same fields as top-level inputs: `sessions_create { providers: [{ provider_deployment_id: "pd_123" }] }`.

Check the exact body shape with `<command> --help` or `list_endpoints { search, includeSchemas: true }`.

## Shared shapes

### Tool filters

Integration providers, session providers, Magic MCP server providers, and Magic MCP endpoints accept `tool_filters`: one filter or an array of filters. A tool must match to be exposed.

```json
[
  { "type": "tool_keys", "keys": ["list_issues", "get_issue"] },
  { "type": "tool_categories", "keys": ["issues"] },
  { "type": "tool_regex", "pattern": "^list_" },
  { "type": "resource_regex", "pattern": "^repo://" },
  { "type": "resource_uris", "uris": ["file:///README.md"] },
  { "type": "prompt_keys", "keys": ["summarize"] },
  { "type": "prompt_regex", "pattern": ".*" }
]
```

Pass `null` to remove filtering. Read a provider's tool keys with `providers tools list --provider-version-id <id>` first.

In the CLI, send filters in the body: `--body '{"tool_filters":[{"type":"tool_keys","keys":["list_issues"]}]}'`. The `--tool-filters` flag takes plain strings, not filter objects.

### Access and ownership

Many resources (integration instances, Magic MCP servers and endpoints, skills) have an `access` block: `type` (`public` or `owner_locked`), `visibility` (`anyone` or `owner`), and an `owner` actor. Owner-locked resources can only be changed by their owner.

### Metadata

Most resources accept `metadata`, a free-form JSON object for your own references (external IDs, tags). Metorial never interprets it.

## Errors

API errors come back as JSON. The CLI prints them to stderr and exits non-zero:

```json
{ "object": "error", "ok": false, "status": 404, "code": "not_found", "message": "The requested provider-deployment could not be found.", "hint": "…" }
```

| Code | Usually means |
| --- | --- |
| `invalid_data` (400) | Body doesn't match the schema. Read `hint` and the command's `--help`. |
| `unauthorized` (401) | Missing or expired credential. Log in again. |
| `forbidden` (403) | The member or key lacks the permission. |
| `not_found` (404) | Wrong ID, wrong instance, or deleted. Check `--instance`. |
| `precondition_failed` (412) | A state rule was violated (for example, a token linked to both a server and an endpoint). |

## Raw API calls

Use these only when no dedicated command or tool exists.

```bash
metorial-admin fetch /provider-listings
metorial-admin fetch /sessions -X POST -d '{"providers":[{"provider_deployment_id":"pd_123"}]}'
metorial-admin fetch /provider-listings -i     # include status and headers
```

`fetch` uses the same authentication and instance as other commands. Paths match the `API` column in each `references/commands.md`.

MCP equivalent:

1. `list_endpoints { search: "provider listings" }` returns callable paths. These are dashboard paths such as `/dashboard/instances/:instanceId/provider-listings`, not the public paths in the command tables.
2. `call_endpoint { method: "GET", endpointPath: "<path from step 1>", instanceId: "inst_…", pathParams: {…}, query: {…}, body: {…} }`.

`call_endpoint` counts as destructive because it can call anything. Prefer the dedicated tool.

## Safety

- Effects are marked in every command table: `read`, `write`, `destructive`. Confirm destructive actions (delete, archive, revoke, disable, rollback, exec, rotate secret) with the user before running them.
- Secrets (API key secrets, Magic MCP token secrets, provider credentials) are shown once. Hand them to the user or store them where they asked. Don't echo them into logs or chat.
- Many deletes are soft (archive). The tables say "Archives" where that applies, and archived resources still appear when listing with a status filter.
