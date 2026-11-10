---
name: metorial-portals
description: Run self-serve Metorial portals where employees or customers find and connect approved tools and skills behind SSO. Covers creating and configuring portals, consumer groups, inviting consumers, granting groups access to provider templates (catalog items built from integrations), Magic MCP servers, skills, skill groups, templates, marketplaces, and plugins, managing consumers and their surfaces, and the consumer CLI (`metorial`) end users use to connect integrations and install them into MCP clients. Use this whenever the user wants to give a team or customers a catalog of tools, onboard or invite end users, control which groups see which integrations or skills, or act as a portal consumer, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial portals

A **portal** is a branded, SSO-protected catalog for **consumers**: people who use tools but don't administer Metorial. Consumers belong to **consumer groups**. **Access rules** grant a group catalog items (provider templates), Magic MCP servers, or skills. When a consumer connects a catalog item, Metorial creates their own integration instance and Magic MCP server.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-portals/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-portals/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI (`metorial-admin`). The MCP tool is the command path joined with underscores (`portals access create` → `portals_access_create`). All commands: [references/commands.md](https://skills.metorial.com/metorial-portals/references/commands.md). End users use a different CLI: [references/consumer-cli.md](https://skills.metorial.com/metorial-portals/references/consumer-cli.md).

## Set up a portal

```bash
metorial-admin portals create --name "Acme tools" --description "Approved AI tools for Acme staff"
metorial-admin portals groups create <portal-id> --name "Everyone" --is-default
metorial-admin portals groups create <portal-id> --name "Engineering"
```

New consumers join the default group. Portal settings (`create` / `update`):

| Setting | Effect |
| --- | --- |
| `allowed_redirect_url_filters` | Which redirect URLs setup flows may return to |
| `session_expiry_time_in_seconds` | Consumer sign-in lifetime |
| `allow_consumer_skill_authoring` / `allow_consumer_skill_publishing` | Whether consumers may write and publish skills |
| `skill_configuration` (update) | `allow_scripts`, `allowed_file_extensions`, `allow_non_standard_directories` for consumer skills |

## Publish tools to groups

1. **Build the integration** with the providers and tool filters to offer ([metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md)). Leave per-user auth to the consumer.
2. **Create a provider template** from it. This is the catalog item. It isn't a generated command yet, so use a raw call:

   ```bash
   metorial-admin fetch /provider-templates -X POST -d '{"name":"GitHub","description":"Issues and PRs","integration_id":"<integration-id>"}'
   metorial-admin fetch /provider-templates            # list
   ```

   MCP: `list_endpoints { search: "provider template" }`, then `call_endpoint` with the returned path. Requires portals on the organization's plan.
3. **Grant access** to a group:

   ```bash
   metorial-admin portals access create <portal-id> --consumer-group-id <group-id> \
     --body '{"access":{"type":"provider_template","provider_template_id":"<template-id>"},"name":"GitHub","readme":"Connect your GitHub to triage issues."}'
   ```

`access.type` options:

| Type | Grants | Extra field |
| --- | --- | --- |
| `provider_template` | A catalog item each consumer connects with their own account | `provider_template_id` |
| `magic_mcp_server` | A shared, already-connected Magic MCP server | `magic_mcp_server_id` |
| `skill` / `skill_template` / `skill_group` | Skills | `skill_id` / `skill_template_id` / `skill_group_id` |
| `skill_marketplace` | A skill marketplace | `skill_marketplace_id`, `permission` (`read`, `manage`) |
| `skill_plugin` | One plugin from a marketplace | `skill_marketplace_id`, `skill_plugin_id` |

`name`, `description`, and `readme` are the listing text consumers see, editable with `portals access update`. The access target itself can't be changed. Delete the rule and create a new one (`portals access delete` revokes it; confirm first).

## Onboard consumers

```bash
metorial-admin portals invites create <portal-id> --name "Bo Lee" --email bo@acme.com --message "Our AI tools live here"
metorial-admin consumers list --search bo@acme.com
```

- Invites email a sign-in link. SSO-enabled portals also admit people directly.
- `consumers create --name --email` creates or links a consumer record without sending an invite.
- Each consumer has profiles per **surface** (web portal, consumer CLI, chat). Inspect them with `consumers surfaces list`.
- What a consumer connected: `magic-mcp servers list --consumer-id <id>`, `sessions tool-calls list --consumer-id <id>`.

Ask before sending invites. They email real people.

## What consumers do

Consumers sign in to the portal (or run `metorial login`), browse the catalog, connect items (OAuth in the portal's UI), and get a personal MCP URL. They can install it into Claude, Cursor, Codex, and other clients with `metorial install <client> <integration-id>`, call tools directly with `metorial call`, and request access to items their groups lack. Details: [references/consumer-cli.md](https://skills.metorial.com/metorial-portals/references/consumer-cli.md).

## Gotchas

- Group membership beyond the default group, SSO, and branding are managed in the dashboard.
- Changing the underlying integration (tool filters, deployment) changes every consumer's connection on their next session.
- A `magic_mcp_server` grant shares one connected account with the whole group. Use `provider_template` when each person should act as themselves.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-portals/references/resources.md): portal, consumer group, access rule, invite, consumer, surface, provider template
- [references/consumer-cli.md](https://skills.metorial.com/metorial-portals/references/consumer-cli.md): the end-user `metorial` CLI
- [references/commands.md](https://skills.metorial.com/metorial-portals/references/commands.md): generated CLI ↔ MCP table
