---
name: metorial-getting-started
description: Start here for anything Metorial. Sets up a Metorial organization from the command line (signup, claim, login, instance selection), walks through a first end-to-end result (deploy a provider, package it as an integration, connect an account, serve it as a Magic MCP server an agent can use), and indexes every other Metorial skill with links. Use this whenever the user mentions Metorial and you don't yet know which skill applies, wants to create a Metorial account or workspace, asks how to give an agent tools through Metorial, or asks what Metorial can do.
---

# Getting started with Metorial

Metorial connects AI agents and apps to external tools (GitHub, Slack, Linear, your own MCP servers) through MCP, with governed access, per-user auth, and full tracing. You operate it with the admin CLI `metorial-admin` or the admin MCP server at `https://mcp.metorial.com/mcp`. Both expose the same operations.

> **Fetching skills remotely.** All Metorial skills are published at `https://skills.metorial.com/<skill>/<path>` (mirror: `https://github.com/metorial/skills/blob/main/<skill>/<path>`). If a skill below isn't installed locally, fetch its `SKILL.md` from that URL, and fetch files it references the same way.

## 1. Get a connection

If you can call `get_account_context` (MCP) or `metorial-admin instance list` (CLI) successfully, skip to step 3. Otherwise follow [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md). The short version:

```bash
npm install -g @metorial/admin
metorial-admin login            # existing account: browser sign-in, saves a profile
```

## 2. Create an organization (new users)

`signup` creates a working organization, with a project and a production instance, without a browser. Use it when the user has no Metorial account.

```bash
metorial-admin signup --region eu1      # or us1; omit --region to see the list and the recommendation
metorial-admin instance list            # the new instance is selected automatically
```

The organization works immediately, but it is **unclaimed** until a person takes ownership:

1. Ask the user which email address to use. If the CLI suggests one, confirm it; never assume it.
2. Run `metorial-admin claim <email>`. Metorial emails the claim link and sends daily reminders. `metorial-admin claim` with no email prints and opens the link instead.
3. The claim token lives only on this machine, so run `claim` from the same machine as `signup`.

Already have an account but no admin MCP connection? Connect it now (see [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md#connect-the-mcp-server)).

## 3. Pick the instance

Everything below lives in an **instance** (production, staging…). List them and choose:

```bash
metorial-admin instance list
metorial-admin providers list --instance <instance-id>   # or: export METORIAL_INSTANCE_ID=<instance-id>
```

MCP: call `instance_list`, then pass `instance_id` to instance-scoped tools. Create additional projects or instances in the dashboard (`metorial-admin open`).

## 4. First result: give an agent GitHub tools

The goal is a hosted MCP URL that exposes a user's GitHub through Metorial. Each step names the CLI command; the MCP tool is the same path with underscores (`providers deployments create` → `providers_deployments_create`).

```bash
# Find the provider and its current version
metorial-admin providers list --search github
metorial-admin providers auth-methods list --provider-version-id <current_version.id>

# Make it runnable
metorial-admin providers deployments create --provider-id <provider-id> --name "GitHub"

# Package it as an approved integration
metorial-admin integrations create --name "GitHub"
metorial-admin integrations providers create --integration-id <integration-id> \
  --provider-id <provider-id> --provider-deployment-id <deployment-id> \
  --provider-auth-method-id <auth-method-id>

# Let the user connect their GitHub account (returns a hosted `url`)
metorial-admin integrations setup --integration-id <integration-id> --name "My GitHub"
```

Send the user the setup session's `url`. They sign in to GitHub in Metorial's own UI, so secrets never pass through chat. Poll with `integrations setup-sessions get <id>` until `status` is `successful` (`expired` means create a new one). The response then includes the active `integration_instance`.

```bash
# Serve the instance as a permanent MCP URL
metorial-admin magic-mcp servers create --integration-instance-id <integration-instance-id> --name "My GitHub"

# Create a token for MCP clients (CLI only; the secret is shown once)
metorial-admin magic-mcp tokens create --name "my-agent" --magic-mcp-server-id <server-id>
```

The server's `endpoints[0].url` (like `https://api.metorial.com/connect/magic/<alias>`) is the MCP URL. Clients send the token as `Authorization: Bearer <secret>`, or append `?key=<secret>`. Tell the user to store the secret themselves instead of echoing it into the conversation.

If the provider's OAuth needs your own OAuth app (no auto-registration), create auth credentials first. See [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md#oauth-apps). Without the CLI (MCP only), ask the user to create the token in the dashboard or with the one CLI command above.

Faster for a backend that calls tools directly: skip integrations and run `sessions create` with the deployment, then `sessions tool-calls create`. See [metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md).

## Skill index

Read [metorial-concepts](https://skills.metorial.com/metorial-concepts/SKILL.md) first when you're unsure which resource you need.

| Skill | Use when |
| --- | --- |
| [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md) | Installing or authenticating the CLI, connecting the admin MCP server, choosing an instance, finding commands, shared conventions |
| [metorial-concepts](https://skills.metorial.com/metorial-concepts/SKILL.md) | Understanding the resource model and choosing between provider, custom provider, integration, Magic MCP server, session, and tool |
| [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md) | Browsing the catalog, reading tools and auth methods, deploying providers, configs, OAuth apps, auth configs, provider setup sessions |
| [metorial-custom-providers](https://skills.metorial.com/metorial-custom-providers/SKILL.md) | Bringing your own MCP server (container, remote, function), builds, environments, promotion, rollback |
| [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md) | Packaging approved providers, tool filters, per-user integration instances, setup sessions, callbacks for provider triggers |
| [metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md) | Hosted MCP URLs for agents: servers, endpoints, groups, tokens, connecting clients |
| [metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md) | Running tools from code, session templates, debugging tool calls, runs, logs, and errors |
| [metorial-identities](https://skills.metorial.com/metorial-identities/SKILL.md) | Actors, agents, identities, credentials, delegation and approval flows |
| [metorial-portals](https://skills.metorial.com/metorial-portals/SKILL.md) | Self-serve catalogs for employees or customers: portals, consumer groups, access rules, invites, the consumer CLI |
| [metorial-skills](https://skills.metorial.com/metorial-skills/SKILL.md) | Authoring, versioning, sharing, and syncing Metorial skills (Magic Skills) |
| [metorial-sandboxes](https://skills.metorial.com/metorial-sandboxes/SKILL.md) | Isolated VMs: machines, exec, shell, files, ports, images, disks |
| [metorial-files-and-stores](https://skills.metorial.com/metorial-files-and-stores/SKILL.md) | Uploading files, public links, stores, documents |
| [metorial-chat](https://skills.metorial.com/metorial-chat/SKILL.md) | Connecting Slack or Microsoft Teams |
| [metorial-events-and-monitoring](https://skills.metorial.com/metorial-events-and-monitoring/SKILL.md) | Webhooks for Metorial events, monitors and alerts (prompt injection, schema changes) |
| [metorial-network](https://skills.metorial.com/metorial-network/SKILL.md) | Firewalls, network policies, enclaves, internet gateway logs, outposts for private networks |

End users of a portal use a different CLI, `metorial` (not `metorial-admin`). See [metorial-portals](https://skills.metorial.com/metorial-portals/references/consumer-cli.md).

## Working rules

- Read before you write: list existing resources and reuse them instead of creating duplicates.
- Confirm destructive actions (delete, archive, revoke, rotate) with the user first.
- Never ask the user to paste secrets into chat. Use setup sessions, or have them run the CLI command themselves.
- When a command fails, read `code` and `hint` in the error. The most common fix is a missing or wrong instance.
