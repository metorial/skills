---
name: metorial-setup
description: Install and authenticate the Metorial admin CLI (`metorial-admin`) or connect to the Metorial admin MCP server at mcp.metorial.com/mcp, then verify access and pick an instance. Use this whenever an agent needs to operate Metorial and has no working CLI or MCP connection yet, hits "no authentication found" or "an instance must be selected" errors, needs to switch organizations, profiles, or instances, wants to find the right command or tool, or needs the conventions shared by every Metorial command (JSON bodies, pagination, output formats, raw API calls).
---

# Metorial setup

Get a working connection to Metorial through the admin CLI or the admin MCP server. Both expose the same operations, so pick whichever your environment supports.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-setup/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-setup/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

## Choose an interface

| Use | When |
| --- | --- |
| **Admin MCP server** `https://mcp.metorial.com/mcp` | Your client supports remote MCP servers with OAuth. Nothing to install. |
| **Admin CLI** `metorial-admin` | You have a shell. Required for creating an organization (`signup`), creating secrets (API keys, Magic MCP tokens, credentials), syncing skills folders, and interactive sandbox shells. |

Use both when you can: the MCP server for most work, the CLI for the operations only it has. See [references/parity.md](https://skills.metorial.com/metorial-setup/references/parity.md).

## Connect the MCP server

Add `https://mcp.metorial.com/mcp` as a remote (Streamable HTTP) MCP server. The client runs the OAuth flow in the browser: the user signs in to Metorial and picks the organization. No API key or headers are needed.

```bash
# Claude Code
claude mcp add --transport http metorial https://mcp.metorial.com/mcp
```

Other clients (Cursor, VS Code, Codex, Claude Desktop, generic JSON config): [references/mcp-clients.md](https://skills.metorial.com/metorial-setup/references/mcp-clients.md).

Verify with the `get_account_context` tool. It returns the organization, project, instance, actor, and user behind the connection. Then call `instance_list` to see which instances you can reach.

## Set up the CLI

```bash
npm install -g @metorial/admin          # or: brew install metorial/tap/metorial-admin
metorial-admin login                    # browser OAuth; saves a profile in ~/.metorial/cli/config.json
metorial-admin instance list            # confirm access and see instance IDs
```

No account yet? `metorial-admin signup --region <eu1|us1>` creates a working organization instantly, without signing in. See [metorial-getting-started](https://skills.metorial.com/metorial-getting-started/SKILL.md).

Non-interactive environments (CI, containers) skip `login` and pass an API key:

```bash
export METORIAL_API_KEY=metorial_sk_...   # instance-scoped secret key: no instance selection needed
metorial-admin providers list
```

Full install, profile, and instance-selection details: [references/cli.md](https://skills.metorial.com/metorial-setup/references/cli.md).

## Select an instance

Almost every resource lives in an **instance** (an isolated environment inside a project, such as production or staging). Organization-level credentials (OAuth logins, MCP connections) can reach several instances, so each call needs to know which one:

- **MCP**: pass `instance_id` (ID or slug) to every instance-scoped tool. Omit it only when the credential is bound to a single instance; if a call fails asking for an instance, add it.
- **CLI**: pass `--instance <id>`, or set `METORIAL_INSTANCE_ID`. In an interactive terminal the CLI asks once and saves the choice to `./.metorial/config.json`. Instance-scoped API keys (`metorial_sk_…`) never need this.

Organization-level resources (event destinations, outposts, API keys) ignore the instance.

## Find the right command or tool

CLI commands and MCP tools are generated from the same API definition. The tool name is the CLI command path joined with underscores, hyphens included:

```
metorial-admin magic-mcp servers list        →  magic_mcp_servers_list
metorial-admin providers auth-configs get    →  providers_auth_configs_get
metorial-admin sandbox machines exec <id>    →  sandbox_machines_exec { machine_id }
```

Positional arguments and flags become snake_case tool inputs (`<provider-id>` → `provider_id`, `--provider-id` → `provider_id`).

To discover:

```bash
metorial-admin --format json cli search "magic mcp token"   # ranked local search
metorial-admin magic-mcp tokens --help                       # arguments and flags
```

With MCP, browse the tool list by category, or call `list_endpoints` with a `search` term. Each domain skill ships a complete `references/commands.md` table of commands, tools, and API paths.

## Conventions

Read [references/conventions.md](https://skills.metorial.com/metorial-setup/references/conventions.md) before writing to Metorial. The short version:

- **Output**: use `--format json` when parsing CLI output.
- **Lists**: paginated. They return `{ items, pagination: { has_more_after, has_more_before } }`. Page with `--limit` and `--after <last id>` (MCP: `limit`, `after`).
- **Complex bodies**: pass `--body '<json>'` or `--body-file body.json`. Body fields merge with flags; the MCP tools take the same fields directly.
- **Raw API**: when no command exists, use `metorial-admin fetch /<path>` (MCP: `call_endpoint`). It is the fallback, not the default.
- **Destructive actions** (delete, archive, revoke, exec, rotate) are flagged in every command table. Confirm them with the user first.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `no authentication found` | Run `metorial-admin login`, or set `METORIAL_API_KEY`. |
| `token can access multiple instances, so an instance must be selected` | Add `--instance <id>` (MCP: `instance_id`). Get IDs from `instance list`. |
| `profile "x" does not exist` | `metorial-admin cli profile list`, then `cli profile set <name>`. |
| Wrong organization | `metorial-admin login` again (adds a profile), or `cli profile set`. For MCP, reconnect the server and choose the other organization. |
| `[metorial] This CLI profile uses an UNCLAIMED Metorial organization` | The org came from `signup`. Ask the user for their email and run `metorial-admin claim <email>`. |
| 403 / missing permission | The signed-in member's role lacks the scope. Ask an organization admin. |

## Related skills

- [metorial-getting-started](https://skills.metorial.com/metorial-getting-started/SKILL.md): first organization, first working MCP URL, index of all skills
- [metorial-concepts](https://skills.metorial.com/metorial-concepts/SKILL.md): what every resource is and how they connect
- [references/commands.md](https://skills.metorial.com/metorial-setup/references/commands.md): instances, API keys, raw API, and discovery commands
