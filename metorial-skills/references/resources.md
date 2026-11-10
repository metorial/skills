# Skill resources

```
Skill ── files (SKILL.md, references…, agents/*.md) ── versions
 ├ Items          attached integration or provider
 ├ Agents         sub-agent documents in agents/
 └ Participants   collaborators
Skill group ── skills (live membership)          Skill template ── starting structure
Skill configuration ── policy (scripts, extensions, directories)
Merge request ── source skill → target skill (perform | close | rollback)
Import (public git | connected repo | zip) → skills      Export (skill | plugin | marketplace) → file
Skill plugin ── skills ── Skill marketplace ── (optional) GitHub repository, one-way sync
```

## Skill

`name` (required), `description`, `client_name` / `client_description` (how clients show it), `license`, `compatibility`, `image_file_id`, `template_id`, `skill_group_id`. `access` holds ownership. `delete` archives.

## Files

Paths are relative to the skill root (a leading `/` is optional). Each file has `size` and `etag`. Markdown files are documents (`get` returns text). Other files return a download URL. Writes accept `content` (text) or `file_id` (an uploaded file), plus `if_match` for optimistic concurrency. Parent folders are created automatically and removed when empty. `/SKILL.md` can't be deleted or moved.

## Item

`type`: `integration` (`integration_id`) or `provider` (`provider_id`). It declares the access the skill needs. `delete` archives.

## Agent

A sub-agent document under `agents/`: `name`, `description`, `content`. Update the name and description. Delete archives it and removes its file.

## Version

Immutable history of a skill's files. `versions list <skill-id>`, `versions get <version-id>`.

## Group

`name`, `description`, `skill_ids`, `allow_consumer_skill_assignment`. Access granted to a group (portal rules, endpoint selections) follows its current membership.

## Template

`name`, `description`, `from_skill_id` (copy an existing skill's structure). New skills reference it with `template_id`.

## Configuration

`allow_scripts`, `allowed_file_extensions` (`null` = no limit), `allow_non_standard_directories`. One default per instance (update `default` to create or change it), plus named configurations attached to plugins and marketplaces.

## Merge request

`source_skill_id`, `target_skill_id`, `title`, `description`. `perform` queues application, `close` discards, `rollback` restores the target to before a completed merge.

## Import and export

Import `source`: `{type:"public", repository_url, ref}`, `{type:"origin", repository_id, ref, path}`, or `{type:"file", file_id}`. It is queued, so poll `imports get`. Export `target`: `skill`, `plugin`, or `marketplace` with the matching ID. Poll `exports get` for the result.

## Plugin and marketplace

A **plugin** bundles skills for clients that install plugins (`name`, `description`, `long_description`, `category`, `skill_configuration_id`, `skill_marketplace_id`). A **marketplace** is a curated catalog of plugins (`repository_access_mode`: `pull_request` | `default_branch`, `force_merge_or_push`, `merge_before_checks_pass`, `skill_configuration_id`). With a GitHub repository connected, Metorial syncs changes one way, Metorial → GitHub. Adding skills to plugins (`/skill-plugins/:id/skills`), plugins to marketplaces (`/skill-marketplaces/:id/plugins`), and repositories are raw API or dashboard actions. `archive` retires either one.
