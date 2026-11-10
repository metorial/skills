---
name: metorial-providers
description: Browse Metorial's provider catalog and make providers runnable. Covers finding a provider (GitHub, Slack, Linear, Notion, any MCP service), reading its versions, tools, triggers, auth methods, and config schema, creating provider deployments, configs and config vaults, registering OAuth apps (auth credentials), connecting user accounts (auth configs) through provider setup sessions, and pinning or filtering tools. Use this whenever the user wants to know what a Metorial provider can do, add or deploy a provider, set up OAuth or API-key auth for one, connect an account, or limit which tools a provider exposes, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial providers

A **provider** is a read-only, versioned definition of a service's tools, triggers, auth methods, and config schema. A **provider deployment** makes it runnable. Configs and auth configs supply the settings and the account it acts as. Everything that runs tools (integrations, sessions, Magic MCP servers) starts from a deployment.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-providers/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-providers/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`providers deployments create` → `providers_deployments_create`, flags → snake_case inputs). Pass `--instance` / `instance_id` as described in [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md#select-an-instance). Every command, tool, and required input: [references/commands.md](https://skills.metorial.com/metorial-providers/references/commands.md).

## Find a provider and read what it can do

```bash
metorial-admin providers list --search linear                 # id, slug, current_version, oauth
metorial-admin providers listings list --search linear --is-verified   # catalog view, with marketplace metadata
metorial-admin providers tools list --provider-version-id <current_version.id>
metorial-admin providers auth-methods list --provider-version-id <current_version.id>
metorial-admin providers triggers list --provider-version-id <current_version.id>
```

- `providers list` also filters by `--auth-method` (`oauth`, `token`, `service_account`, `custom`) and `--auth-setup configured|not_configured`.
- `providers tools list --provider-auth-method-id <id>` shows only the tools that work with that auth method.
- `providers specifications get <id>` returns the full spec: tools with input schemas, auth methods, and config fields.
- Browse by `providers categories list`, `providers collections list`, `providers publishers list`. Organize your own picks with `providers groups create` and `providers_groups_add_listing`.

## Deploy a provider

```bash
metorial-admin providers deployments create --provider-id <provider-id> --name "Linear"
```

Optional inputs:

| Input | Effect |
| --- | --- |
| `--locked-provider-version-id <id>` | Pin to a version. Omit (or set `null` on update) to follow the latest. |
| `--config '{"value":{…}}'` | Inline default config, or `{"provider_config_vault_id":"…"}` |
| `--provider-config-id <id>` | Reuse an existing config |
| `--body '{"tool_filters":[…]}'` | Expose only some tools (see [tool filters](https://skills.metorial.com/metorial-setup/references/conventions.md#tool-filters)) |

Read the config schema before writing config values: `providers configs get-config-schema` (MCP `providers_configs_get_config_schema`). Deployments can be updated (`providers deployments update <id>`) but not deleted.

## Connect an account (auth config)

An **auth config** is one account's credentials (OAuth tokens or an API key) for a provider. The safe way to create one is a **provider setup session**: Metorial hosts the OAuth redirect or the form, so secrets never pass through the agent.

```bash
metorial-admin providers setup-sessions create --provider-id <provider-id> \
  --provider-deployment-id <deployment-id> --provider-auth-method-id <auth-method-id> \
  --type auto --redirect-url https://example.com/done
```

1. Send the user the returned `url`.
2. Poll `providers setup-sessions get <id>` until `status` is `completed` (or `failed` / `expired`; read `error`).
3. Use the returned `auth_config.id` (and `config.id`, if one was collected) in integrations, sessions, or Magic MCP servers.

Session `type`:

| Type | Collects |
| --- | --- |
| `auto` | Whatever the provider needs (auth, config, or both). The default choice. |
| `auth_only` / `config_only` / `auth_and_config` | Exactly that |
| `admin` | An admin consent link for auth methods that support it. Creates nothing and can't be bound to an identity or consumer. |

Bind the result to a person or agent with `--identity-id`, or to a portal consumer with `--consumer-id`. To connect several providers at once, use an integration setup session instead ([metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)).

With the CLI and a secret the user has already supplied (for example an API token stored in your environment), you can create an auth config directly. This is CLI only because it accepts secrets:

```bash
metorial-admin providers auth-configs create --provider-auth-method-id <id> \
  --provider-deployment-id <deployment-id> --value-file ./auth.json
```

## OAuth apps

An OAuth auth method needs an OAuth app. Check the provider's `oauth.auto_registration.status`:

- `supported`: Metorial registers an app for you. Setup sessions just work.
- `unsupported`: register an app with the service. Use `oauth.callback_url` from `providers get` as the redirect URI, then save the client credentials as **auth credentials** (CLI only, because it accepts secrets):

```bash
metorial-admin providers credentials create --provider-id <provider-id> --name "Our Linear app" \
  --config-file ./oauth-app.json        # {"client_id":"…","client_secret":"…","scopes":["…"]}
```

Pass the resulting ID as `--provider-auth-credentials-id` to setup sessions and integration providers. Without the CLI, ask the user to add the OAuth app in the dashboard.

## Configs and vaults

- **Config** (`providers configs`): non-secret settings for a deployment, from `--value` or `--provider-config-vault-id`. Read with `providers_configs_get`, create through the CLI or inline on a deployment.
- **Config vault** (`providers vaults`): saved reusable values, including secrets, that configs can be built from. Created through the CLI only.

## Gotchas

- Provider `slug` and `id` both work for `--provider-id`. Version-scoped lists (`tools`, `auth-methods`, `triggers`) need `--provider-version-id`, usually `current_version.id` from `providers get`.
- A pinned deployment never picks up new tools. Unpin with `providers deployments update <id> --locked-provider-version-id null`.
- Auth configs and credentials never return their secret values. Recreate them to change secrets.
- Deleting an auth config breaks every integration instance, session template, and Magic MCP server that uses it. Confirm with the user first.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-providers/references/resources.md): every provider resource, its fields, lifecycle, and relations
- [references/commands.md](https://skills.metorial.com/metorial-providers/references/commands.md): generated CLI ↔ MCP table
- Next: package deployments as an [integration](https://skills.metorial.com/metorial-integrations/SKILL.md), or run them in a [session](https://skills.metorial.com/metorial-sessions/SKILL.md)
