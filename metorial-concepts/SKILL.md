---
name: metorial-concepts
description: The Metorial resource model. Explains what each resource is (organization, project, instance, provider, custom provider, provider deployment, auth config, integration, integration instance, session, session template, Magic MCP server, endpoint, token, tool, identity, actor, consumer, portal, skill) and how they depend on each other. Use this whenever you need to decide which Metorial resource to create, untangle similar-sounding terms (provider vs. custom provider vs. integration vs. Magic MCP server vs. tool), explain Metorial's architecture, or plan a multi-step setup before running CLI commands or MCP tools.
---

# Metorial concepts

Metorial connects AI agents and apps to external tools through MCP, with governed access and full tracing. This skill explains the resources involved, how they build on each other, and which one to reach for.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-concepts/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-concepts/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

## The map

```
Organization ─ members, teams, roles, API keys, event destinations, outposts
└─ Project ─ one app or product
   └─ Instance ─ isolated environment (production, staging…). Almost everything below lives here.

      CAPABILITY                     CONFIGURATION                         RUNTIME
      ──────────                     ─────────────                         ───────
      Provider (catalog)  ◄── Custom provider (your MCP server)
        │ versions → tools, triggers, auth methods, config schema
        ▼
      Provider deployment ── config, auth config / credentials
        ▼
      Integration ── integration providers (deployment + auth + tool filters)
        ▼
      Integration instance ── one owner's configured copy ──────────►  Session template → Session
        ▼                                                                   │ tool calls, runs, errors
      Magic MCP server ── stable MCP URL (+ endpoints, groups, tokens) ──► Magic MCP session

      ACCESS: actors → identities → credentials (+ delegations) · consumers → portals → consumer groups
      CONTENT: skills, files, documents, stores · COMPUTE: sandboxes · OPS: events, monitoring, network
```

Read top to bottom: a **provider** says what is possible. A **deployment** makes it runnable with settings and auth. An **integration** packages approved deployments with tool limits. An **integration instance** binds that package to an owner. A **Magic MCP server** gives it a permanent URL. **Sessions** are where tools actually run and get logged.

## Which resource do I need?

| Goal | Create | Skill |
| --- | --- | --- |
| Find out what a third-party service can do | Nothing. Read **provider** tools and auth methods. | [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md) |
| Make a catalog service runnable with your settings or OAuth app | **Provider deployment** (+ config, auth credentials) | [metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md) |
| Bring your own MCP server (container, remote URL, function) | **Custom provider**. It becomes a provider. | [metorial-custom-providers](https://skills.metorial.com/metorial-custom-providers/SKILL.md) |
| Approve a service for reuse, with only some tools allowed | **Integration** + integration providers | [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md) |
| Connect one person's or agent's account to an integration | **Integration instance**, usually through a setup session | [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md) |
| Give an agent or MCP client a URL it can connect to | **Magic MCP server** (+ token) | [metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md) |
| Put several servers behind one URL | **Magic MCP endpoint** | [metorial-magic-mcp](https://skills.metorial.com/metorial-magic-mcp/SKILL.md) |
| Run tools programmatically from your backend, or debug a failing tool call | **Session** (or template); inspect tool calls, runs, errors | [metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md) |
| Let users self-serve approved tools behind SSO | **Portal** + consumer groups + access | [metorial-portals](https://skills.metorial.com/metorial-portals/SKILL.md) |
| Model who owns which accounts, and let one actor act for another | **Identity**, **actor**, **delegation** | [metorial-identities](https://skills.metorial.com/metorial-identities/SKILL.md) |
| Package instructions, files, and integrations as a reusable workflow | **Skill** | [metorial-skills](https://skills.metorial.com/metorial-skills/SKILL.md) |
| Run code in an isolated VM | **Sandbox machine** | [metorial-sandboxes](https://skills.metorial.com/metorial-sandboxes/SKILL.md) |
| React to events in an external service | **Callback** on an integration provider | [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md) |
| Receive Metorial's own events in your system | **Event destination** + listeners | [metorial-events-and-monitoring](https://skills.metorial.com/metorial-events-and-monitoring/SKILL.md) |

## Terms that get confused

| Term | It is | It is not |
| --- | --- | --- |
| **Provider** | A read-only, versioned definition of a service's tools, triggers, auth methods, and config schema (GitHub, Slack, or your custom provider) | Something that runs. Deploy it first. |
| **Custom provider** | Your own MCP server registered with Metorial. Each successful build produces a normal provider version. | A different kind of provider at runtime. Once built, it behaves like any catalog provider. |
| **Provider deployment** | A provider pinned to a version, plus default config: the runnable unit | Per-user auth. That's an auth config. |
| **Auth credentials** vs. **auth config** | Credentials are your OAuth app (client ID and secret). An auth config is one user's connection (their token), created by OAuth or a pasted API key. | Interchangeable |
| **Integration** | An approved, versioned bundle of one or more integration providers (deployment + auth choice + tool filters) | A connection to someone's account. That's an integration instance. |
| **Integration instance** | An integration materialized for an owner (actor or identity) with their config and auth | A Metorial "instance" (environment). Different word, different thing. |
| **Session** | A live runtime that exposes tools from session providers and records every message, tool call, and error | Long-lived. Sessions are created per use, while templates and Magic MCP servers persist. |
| **Session template** | Reusable recipe for sessions (which providers, configs, auth) | A running session |
| **Magic MCP server** | A stable, hosted MCP URL backed by a session template. Metorial creates and reuses the session on connect. | The admin MCP server at `mcp.metorial.com/mcp`, which administers Metorial itself |
| **Tool** | One callable action of a provider (`search_issues`). Exposed through sessions and Magic MCP servers, and limited with tool filters. | A resource you create |
| **Skill** (Magic Skill) | Instructions, files, sub-agents, and attached integrations packaged for agents | A *provider skill*: a read-only capability blurb on a provider page |
| **Consumer** | An end user of a portal or consumer CLI, with one profile per surface | An organization member (dashboard user) |

Full definitions: [references/glossary.md](https://skills.metorial.com/metorial-concepts/references/glossary.md).

## Behavior worth knowing

- **Instances are hard boundaries.** Deployments, auth configs, sessions, keys, and logs never cross instances. Build in staging, then recreate the setup in production.
- **Versions pin behavior.** Deployments pin a provider version, and integrations and integration providers keep version history, so upstream changes don't silently alter running setups.
- **Deletes are often archives.** Integrations, integration providers, integration instances, and custom providers archive rather than vanish. Dependents keep working until reconciled.
- **Secrets never come back.** API keys, Magic MCP token secrets, and OAuth credentials are shown once or never. Setup sessions exist so users can enter secrets in Metorial's own UI instead of in chat.
- **Everything is traced.** Each tool call through a session or Magic MCP server records messages, runs, logs, and errors you can query.

## Deep dives

- [references/hierarchy.md](https://skills.metorial.com/metorial-concepts/references/hierarchy.md): organization, project, instance; which resources are organization-level
- [references/integration-stack.md](https://skills.metorial.com/metorial-concepts/references/integration-stack.md): provider → deployment → integration → instance → session → Magic MCP, with the fields that link them
- [references/access-model.md](https://skills.metorial.com/metorial-concepts/references/access-model.md): actors, identities, credentials, delegation, consumers, portals, tokens, ownership
- [references/glossary.md](https://skills.metorial.com/metorial-concepts/references/glossary.md): every term, A–Z
