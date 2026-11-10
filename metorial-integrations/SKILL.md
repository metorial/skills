---
name: metorial-integrations
description: Package approved Metorial provider deployments as integrations and connect people's or agents' accounts to them. Covers creating integrations and integration providers (deployment, auth method, OAuth app, config, tool filters), controlling what instances may customize, creating per-user integration instances through hosted setup sessions, starting sessions or session templates from an instance, and callbacks that deliver provider trigger events (new issue, new message) for an integration provider. Use this whenever the user wants to approve or bundle tools for reuse, restrict which tools are allowed, onboard users so each connects their own account, react to events from an external service, or troubleshoot an integration instance, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial integrations

An **integration** is an approved, versioned bundle of one or more **integration providers**. Each one fixes a provider deployment, the auth method or OAuth app, a default config, and tool filters. An **integration instance** is that bundle connected for one owner (a person, agent, or identity) with their own auth configs. Instances are what sessions and Magic MCP servers run on.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-integrations/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-integrations/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`integrations providers create` → `integrations_providers_create`). Exceptions: `integrations setup` is a shortcut for `integrations setup-sessions create`, and `integrations instances create-session-template` is `integrations_instances_create_template`. All commands: [references/commands.md](https://skills.metorial.com/metorial-integrations/references/commands.md).

## Create an integration

Prerequisite: a provider deployment, and the auth method ID to use ([metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)).

```bash
metorial-admin integrations create --name "Engineering tools"
metorial-admin integrations providers create --integration-id <integration-id> \
  --provider-id <provider-id> --provider-deployment-id <deployment-id> \
  --provider-auth-method-id <auth-method-id> \
  --body '{"tool_filters":[{"type":"tool_keys","keys":["list_issues","get_issue","create_comment"]}]}'
```

Repeat `integrations providers create` for each provider in the bundle. Optional: `--provider-auth-credentials-id` (your OAuth app), `--provider-config-id` (default config), and `--callbacks '{"status":"enabled"}'` (see [Callbacks](#callbacks)).

Integration settings (flags on `integrations create` / `update`):

| Setting | Effect |
| --- | --- |
| `--can-attach-custom-tool-filters` | Instances may add their own tool filters, which narrow the integration's |
| `--can-override-tool-filters` | Instance filters may replace the integration's instead of narrowing them (implies attach) |
| `--can-attach-custom-provider-config` | Instances may bring their own provider config |
| `--use-integration-name-in-tool-names` | Prefix tool names with the integration name, to avoid collisions when several are combined |
| `--enable-callback-tools` | Sessions get tools to list, get, and mark callback events as read |

Every change to an integration or integration provider creates a new version. Existing instances keep working and pick up the change.

## Connect an account: setup sessions

A setup session gives the user a hosted page where they connect every provider in the integration (OAuth or form). No secrets pass through you.

```bash
metorial-admin integrations setup --integration-id <integration-id> --name "Alice – Engineering tools" \
  --identity-actor-id <actor-id> --redirect-url https://example.com/connected
```

1. Send the user the returned `url`. Each provider is a `step` with its own `url` and status.
2. Poll `integrations setup-sessions get <id>` until `status` is `successful` (`pending`, `successful`, `expired`).
3. Read the `integration_instance` from the response. It is now `active`.

- Without `--integration-instance-id`, a new draft instance is created. With it, the existing instance is reused and its configs and auth configs are overwritten on completion. Use this to reconnect an expired account.
- Set the owner with `--identity-actor-id` (a person or agent) and/or `--identity-id` ([metorial-identities](https://skills.metorial.com/metorial-identities/SKILL.md)).
- `--expires-at` (ISO 8601) bounds the link. `--configuration` sets the page layout (`ui.layout`: `box`, `side`, `light`) and whether tool filter options are shown (`tool_filters.enabled`).

If you already hold auth config IDs (for example from provider setup sessions), create the instance directly:

```bash
metorial-admin integrations instances create --integration-id <integration-id> --name "Service account" \
  --body '{"providers":[{"provider_id":"<provider-id>","provider_auth_config_id":"<auth-config-id>"}]}'
```

Instance `status`: `draft` (not yet connected), `active`, `archived`.

## Use an instance

| Goal | Command |
| --- | --- |
| Hosted MCP URL for an agent | `magic-mcp servers create --integration-instance-id <id>` ([metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md)) |
| A session to call tools from code | `integrations instances create-session <id>` ([metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md)) |
| A reusable session template | `integrations instances create-session-template <id>` (creates or updates the instance's shared template) |

## Callbacks

Callbacks deliver a provider's **trigger** events (for example "issue created") for every instance of an integration provider. Only providers whose triggers are enabled support them. List triggers with `providers triggers list --provider-version-id <id>`.

```bash
metorial-admin callbacks create --integration-id <integration-id> --integration-provider-id <integration-provider-id>
```

This is the same as setting `callbacks.status` to `enabled` on the integration provider. Metorial then registers a **callback instance** for each matching integration instance in the background.

Receive the events in one of three ways:

- **Webhook**: create an event destination and a listener for callback events ([metorial-events-and-monitoring](https://skills.metorial.com/metorial-events-and-monitoring/SKILL.md)).
- **Pull**: `callbacks events list --callback-id <id>`, `callbacks events get <id>`.
- **Agent tools**: enable `--enable-callback-tools` on the integration, so sessions can list and read events.

`callbacks delete <id>` disables callbacks on the integration provider and tears down every callback instance. Check registration with `callbacks instances list`.

## Change and retire

- Update tool filters or the deployment with `integrations providers update <id>`. Instances follow automatically.
- `integrations providers delete <id>` and `integrations instances delete <id>` **archive**. Sessions and Magic MCP servers built on them stop getting those tools, so confirm with the user first.
- To swap a user's account, run a setup session with `--integration-instance-id`.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-integrations/references/resources.md): integration, integration provider, instance, instance provider, setup session, callback; fields, lifecycle, and tool filter layering
- [references/commands.md](https://skills.metorial.com/metorial-integrations/references/commands.md): generated CLI ↔ MCP table
