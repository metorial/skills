# What each interface can do

The admin CLI and the admin MCP server share one API definition, so almost every operation exists in both. The exceptions are below. Each domain skill's `references/commands.md` marks missing equivalents with **—**.

## CLI only

| Capability | CLI | Why it isn't an MCP tool | MCP workaround |
| --- | --- | --- | --- |
| Create an organization | `signup`, `claim` | Runs before any account exists | Ask the user to sign up at metorial.com, or run the CLI |
| Sign in and manage profiles | `login`, `logout`, `cli profile …` | The MCP connection handles its own OAuth | Reconnect the server |
| Create, rotate, reveal, revoke API keys | `api-keys create\|rotate\|reveal\|revoke\|update` | Returns secrets | `api_keys_list` / `api_keys_get` read metadata only |
| Create Magic MCP tokens, read token secrets | `magic-mcp tokens create\|get\|list` | Returns secrets | `magic_mcp_tokens_update`, `_add_groups`, `_remove_groups`, `_delete` manage existing tokens |
| Create provider credentials and auth configs from raw secrets | `providers credentials create`, `providers auth-configs create`, `providers configs create`, `providers vaults create` | Accepts secrets | Use a provider setup session (`providers_setup_sessions_create`) so the user enters secrets in Metorial's own UI |
| Create outpost credentials | `outposts credentials create` | Returns secrets | — |
| Documents | `documents …` | Not yet in the MCP contract | `call_endpoint` |
| Sync a skill as a local folder | `skills pull\|push\|status` | Needs a filesystem | `skills_files_list`, `skills_files_get`, `skills_files_put`, `skills_files_batch` |
| Interactive sandbox shell, file transfer | `sandbox machines shell`, `sandbox machines files …` | Needs a terminal or filesystem | `sandbox_machines_exec`, `sandbox_machines_access_files` |
| Upload large files or directories | `files upload <path>` (zips directories) | — | `files_upload` takes base64 content up to 5 MB |
| Starter projects | `example list\|create` | Writes to the local disk | — |

## MCP only

| Tool | Purpose | CLI equivalent |
| --- | --- | --- |
| `get_account_context` | Who and what the connection is authenticated as | `cli profile get <name>` plus `instance list` |
| `list_endpoints` | Search callable API endpoints, optionally with schemas | `cli search` (commands), `--help` |
| `call_endpoint` | Validated raw API call | `fetch` |

## Dashboard only

| Capability | Where |
| --- | --- |
| Create projects and additional instances | Dashboard (`metorial-admin open`) |
| Organization members, teams, roles, policies | Dashboard → Organization settings |
| Billing | Dashboard |

`signup` creates the first project and instance automatically.

## Creating secrets on the MCP path

When only the MCP server is available and a step needs a secret (an API key, a Magic MCP token, raw provider credentials), don't ask the user to paste secrets into chat. Either:

1. Use a setup session (providers or integrations), which gives the user a hosted URL where they enter credentials or complete OAuth, or
2. Ask the user to run the one CLI command, or to create the secret in the dashboard.
