---
name: metorial-skills
description: Author, organize, and distribute Metorial skills (Magic Skills): reusable agent workflows made of SKILL.md instructions, files, sub-agents, and attached integrations or providers. Covers creating skills, editing files remotely or syncing a skill as a local folder (pull, push, status), attaching integrations, skill groups and templates, versions, merge requests between skills, importing from git or zip, exporting, plugins and marketplaces (including GitHub sync), skill policies, and serving skills to MCP clients and portals. Use this whenever the user wants to create, edit, publish, share, import, export, or govern skills on Metorial, sync a skill folder, or make skills available to Claude, Cursor, or portal users, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial skills

A **skill** (Magic Skill in the dashboard) is a versioned folder for agents: a root `SKILL.md`, supporting files, optional sub-agent documents in `agents/`, and **items** that attach the integrations or providers it uses. Skills are organized into **groups** and **templates**, bundled into **plugins** and **marketplaces**, and delivered through portals, Magic MCP endpoints, exports, or a GitHub-synced marketplace.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-skills/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-skills/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`skills files put` → `skills_files_put`). `skills pull|push|status` are CLI only. Over MCP, edit files with `skills_files_*`. All commands: [references/commands.md](https://skills.metorial.com/metorial-skills/references/commands.md).

## Create a skill

```bash
metorial-admin skills create --name "Summarize Linear escalations" \
  --description "Reviews recent Linear issues and drafts a customer-ready escalation summary."
metorial-admin skills items create <skill-id> --type integration --integration-id <integration-id>
```

- Name it after the job, not the implementation. The description says what it does and when to use it.
- `--template-id` starts from a skill template. `--skill-group-id` files it into a group.
- Items (`--type integration|provider`) declare the access the workflow needs, and portals show them on the skill card.

## Edit files

**As a local folder (CLI)**, best for real authoring:

```bash
metorial-admin skills pull <skill> ./escalations    # skill ID or slug
# edit files…
metorial-admin skills status ./escalations
metorial-admin skills push ./escalations --dry-run
metorial-admin skills push ./escalations
```

Push refuses to overwrite remote changes made since the pull. Pull again, or pass `--force` only when the user agrees to discard them. Details, ignore rules, and conflict handling: [references/local-sync.md](https://skills.metorial.com/metorial-skills/references/local-sync.md).

**File by file (CLI or MCP):**

```bash
metorial-admin skills files list <skill-id>                         # path, size, etag
metorial-admin skills files get <skill-id> --path /SKILL.md
metorial-admin skills files put <skill-id> --path /references/api.md --content "$(cat api.md)" --if-match <etag>
metorial-admin skills files move <skill-id> --path /old.md --to-path /new.md
metorial-admin skills files delete <skill-id> --path /references/old.md
metorial-admin skills files batch <skill-id> --changes-file changes.json   # up to 100 put/delete/move changes
```

- Markdown files become collaborative documents. Other files are stored as-is. For binary files, upload first (`files upload`, or MCP `files_upload`), then `put --file-id`.
- Pass `--if-match <etag>` to avoid clobbering concurrent edits (`null` means "must not exist yet").
- `batch` validates everything first but applies changes in order, not atomically.
- The root `SKILL.md` can't be deleted or moved.
- Sub-agents: `skills agents create <skill-id> --name … --content …` writes an agent document.

## Versions, collaboration, and merges

- Every change creates a version: `skills versions list <skill-id>`.
- `skills participants list` shows collaborators.
- Propose changes from one skill (for example a fork) into another: `skills merge-requests create --source-skill-id … --target-skill-id … --title …`, then `perform` to apply (queued), `close` to discard, or `rollback` to restore the target after a completed merge. Confirm `perform` and `rollback` with the user.

## Organize

| Resource | Use | Create |
| --- | --- | --- |
| Skill group | A playbook of related skills, such as "Support" | `skills groups create --name … --skill-ids a,b` (`--allow-consumer-skill-assignment` lets consumers add their own) |
| Skill template | A starting structure for new skills | `skills templates create --name … --from-skill-id <skill-id>` |
| Skill configuration | A policy: `allow_scripts`, `allowed_file_extensions`, `allow_non_standard_directories` | `skills configurations create\|update` (update `default` to change the instance default) |

## Distribute

| To reach | Do |
| --- | --- |
| Portal users | Grant a `skill`, `skill_group`, `skill_template`, `skill_marketplace`, or `skill_plugin` access rule ([metorial-portals](https://skills.metorial.com/metorial-portals/SKILL.md#publish-tools-to-groups)) |
| Claude Code, Cursor, and other plugin systems | A **plugin** in a **marketplace**, optionally synced one-way to a GitHub repository |
| A file | `skills exports create --target skill --skill-id <id>` (also `plugin` or `marketplace`), then `skills exports get <id>` for the download |

Plugins and marketplaces:

```bash
metorial-admin skills marketplaces create --name "Acme skills" --repository-access-mode pull_request
metorial-admin skills plugins create --name "Support" --skill-marketplace-id <marketplace-id>
metorial-admin fetch /skill-plugins/<plugin-id>/skills -X POST -d '{"skill_id":"<skill-id>"}'
```

Adding skills to a plugin, adding plugins to a marketplace (`/skill-marketplaces/<id>/plugins`), and connecting a repository are raw API calls (MCP: `list_endpoints { search: "skill plugin" }` → `call_endpoint`) or dashboard actions. `skills marketplaces sync <id>` forces a repository sync. `repository_access_mode` is `pull_request` (changes arrive as PRs) or `default_branch` (direct pushes).

## Import

```bash
metorial-admin skills imports create --body '{"source":{"type":"public","repository_url":"https://github.com/acme/skills","ref":"main"}}'
metorial-admin skills imports get <import-id>           # status and created skills
```

Sources: `public` (git URL, optional `ref`), `origin` (a connected repository: `repository_id`, `ref`, `path`), or `file` (an uploaded zip: `file_id`).

## Retire

`skills delete`, `skills groups delete`, `skills templates delete`, `skills plugins archive`, and `skills marketplaces archive` all archive. Access rules and endpoints that reference them stop serving them, so confirm first.

## Reference

- [references/local-sync.md](https://skills.metorial.com/metorial-skills/references/local-sync.md): pull/push/status, conflict rules, `.metorialignore`
- [references/resources.md](https://skills.metorial.com/metorial-skills/references/resources.md): skill, file, item, agent, version, group, template, configuration, merge request, import, export, plugin, marketplace
- [references/commands.md](https://skills.metorial.com/metorial-skills/references/commands.md): generated CLI ↔ MCP table
