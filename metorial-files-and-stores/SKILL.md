---
name: metorial-files-and-stores
description: Upload and share files on Metorial, organize them in file stores (folder trees of files and documents), and work with collaborative documents. Covers uploading files with the right purpose (sandbox image build contexts, skill images, chat attachments, organization images), public file links with expiry, creating stores from scratch, a template, or a parent store, adding, moving, and removing store items in bulk, store access levels, and documents with version history. Use this whenever the user wants to upload, share, link, store, or organize files or documents on Metorial, needs a file ID for another resource, or asks about stores, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial files and stores

A **file** is an uploaded blob with a **purpose**. Other resources reference it by ID (image builds, skill files, chat attachments, avatars). A **file link** is a public URL for a file. A **store** is a folder tree of files and **documents** (collaboratively edited text with versions). Skills are stored as stores internally, so skill files follow the same rules.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-files-and-stores/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-files-and-stores/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`stores items modify` → `stores_items_modify`). `documents` commands are CLI only. Over MCP, call `/documents` with `call_endpoint` (find paths with `list_endpoints { search: "document" }`). All commands: [references/commands.md](https://skills.metorial.com/metorial-files-and-stores/references/commands.md).

## Upload a file

```bash
metorial-admin files upload ./report.pdf --title "Q3 report"                          # purpose generic
metorial-admin files upload ./my-image --purpose sandbox_image_build_context          # a folder is zipped first
metorial-admin files upload ./notes.md --store-id <store-id> --store-path /notes.md   # also place it in a store
```

Over MCP: `files_upload { fileBase64, filename, contentType?, purpose?, title? }`, at most 5 MB. It returns `fileId`. For bigger files, use the CLI.

| Purpose | Used by |
| --- | --- |
| `generic` | Default. Store items, skill files (`skills files put --file-id`), file links |
| `sandbox_image_build_context` | `sandbox images builds create --file-id` (zip or tar, ≤ 50 MB) |
| `chat_message_attachment` | Chat messages |
| `skill_image`, `organization_image`, `project_brand_image`, `user_image` | Avatars and logos |
| `skill_export` | Created by skill exports, not uploaded |

`files list --purpose … --store-id …` filters. `files get <id>` shows metadata. `files delete <id>` breaks anything that still references the file, so confirm first.

## Share a file

```bash
metorial-admin files links create --file-id <file-id> --expires-at 2026-12-01T00:00:00Z
```

The response's `url` (`https://files.metorial.com/files/<file-id>/<key>`) works for anyone who has it, until `expires_at` (omit for no expiry). Revoke with `files links delete <link-id>`. Ask before creating a link without expiry for anything sensitive.

## Organize files in a store

```bash
metorial-admin stores create --name "Research" --access private
metorial-admin stores items modify <store-id> --operations '[
  {"type":"add","path":"/papers/"},
  {"type":"add","path":"/papers/attention.pdf","fileId":"<file-id>"},
  {"type":"add","path":"/summary.md","documentId":"<document-id>"}
]'
metorial-admin stores items list <store-id> --type file --type document --type directory
```

- Operations use camelCase keys: `type` (`add`, `modify`, `remove`), `itemId`, `fileId`, `documentId`, `path`.
- `add` with only a `path` creates a folder. Parent folders must exist, so add them first in the same batch.
- `modify` takes `itemId` plus a new `path` (move or rename) or new content (`fileId` / `documentId`).
- `remove` takes only `itemId`. Folders must be empty. The root can't be removed.
- Up to 500 operations per call and 1,000 items per store. Item lists default to files and documents. Add `--type directory` to see folders.
- `--operations-file ops.json` keeps large batches readable.

Store `access`: `private` (only participants and admins), `public_read`, or `public_write`. Over MCP, the same calls take `operations` as an array.

### Copy a store

- `stores create --name … --parent-id <store-id>` clones a store. The copy follows the parent until you change it.
- `stores create --name … --template-id <template-id>` creates a store from a store template. Template-linked stores are `public_read` unless you ask for `public_write`.
- Use one or the other, not both.

`stores delete` fails while a skill or a store template uses the store. Confirm before deleting: it removes every item.

## Documents

```bash
metorial-admin documents create --title "Runbook" --content "$(cat runbook.md)"
metorial-admin documents update <document-id> --content "$(cat runbook.md)"
metorial-admin documents versions list <document-id>
metorial-admin documents list --store-id <store-id>
```

Documents are Markdown text that people edit together in the dashboard. Every update creates a version. Markdown files pushed into skills or stores become documents automatically.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-files-and-stores/references/resources.md): file, file link, store, store item, document, limits
- [references/commands.md](https://skills.metorial.com/metorial-files-and-stores/references/commands.md): generated CLI ↔ MCP table
