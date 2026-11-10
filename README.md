# Metorial skills

Agent skills for operating [Metorial](https://metorial.com) with the admin CLI (`metorial-admin`) or the admin MCP server (`https://mcp.metorial.com/mcp`). Each skill covers one area end to end, works with either interface, and links to the others.

Start with [metorial-getting-started](metorial-getting-started/SKILL.md).

## Skills

| Skill | Covers |
| --- | --- |
| [metorial-getting-started](metorial-getting-started/SKILL.md) | Org setup from the CLI, a first end-to-end result, index of all skills |
| [metorial-setup](metorial-setup/SKILL.md) | Installing and authenticating the CLI, connecting the MCP server, instances, conventions |
| [metorial-concepts](metorial-concepts/SKILL.md) | Resource model: provider, custom provider, integration, Magic MCP server, session, tool |
| [metorial-providers](metorial-providers/SKILL.md) | Catalog, deployments, configs, OAuth apps, auth configs, setup sessions |
| [metorial-custom-providers](metorial-custom-providers/SKILL.md) | Your own MCP servers: container, remote, function; builds, promotion, rollback |
| [metorial-integrations](metorial-integrations/SKILL.md) | Integrations, tool filters, per-user instances, setup sessions, callbacks |
| [metorial-magic-mcp](metorial-magic-mcp/SKILL.md) | Hosted MCP URLs: servers, endpoints, groups, tokens, client setup |
| [metorial-sessions](metorial-sessions/SKILL.md) | Sessions, templates, tool calls, runs, logs, debugging |
| [metorial-identities](metorial-identities/SKILL.md) | Actors, identities, credentials, delegations, approvals |
| [metorial-portals](metorial-portals/SKILL.md) | Portals, consumer groups, access rules, invites, the consumer CLI |
| [metorial-skills](metorial-skills/SKILL.md) | Magic Skills: authoring, local sync, versions, groups, plugins, marketplaces |
| [metorial-sandboxes](metorial-sandboxes/SKILL.md) | Machines, exec and shell, files, lifecycle, disks, images, ports |
| [metorial-files-and-stores](metorial-files-and-stores/SKILL.md) | Files, public links, stores, documents |
| [metorial-chat](metorial-chat/SKILL.md) | Slack and Teams bots: connections, instances, messages, chat events |
| [metorial-events-and-monitoring](metorial-events-and-monitoring/SKILL.md) | Webhooks, listeners, signatures, audit logs, monitors, alerts |
| [metorial-network](metorial-network/SKILL.md) | Network policies, firewalls, internet gateway, enclaves, outposts |

## Use them

**Remotely.** Every file is served at `https://skills.metorial.com/<skill>/<path>` and mirrored at `https://github.com/metorial/skills/blob/main/<skill>/<path>`. Skills link to each other with these full URLs, so an agent can fetch only what it needs:

```
https://skills.metorial.com/metorial-getting-started/SKILL.md
```

**Locally.** Copy the skill folders into your agent's skills directory, for example `~/.claude/skills/` for Claude Code:

```bash
git clone https://github.com/metorial/skills.git
cp -R skills/metorial-* ~/.claude/skills/
cp -R skills/metorial-* ~/.agents/skills/