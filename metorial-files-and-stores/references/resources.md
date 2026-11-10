# File and store resources

```
File (purpose) ──┬─ File link (public URL, optional expiry)
                 └─ referenced by: store items, skill files, image builds, chat attachments, images
Store (access) ── Store items: directory | file → File | document → Document (versions)
  ├ parent store (clone that follows the parent until changed)
  └ store template (stores created from it stay linked)
```

## File

`id` (`fil_…`), `purpose`, name, title, size, content type. `files list` filters by `purpose`, `store_id`, `document_id`, `file_link_id`, and dates. Upload limits: 5 MB over MCP `files_upload`, larger with the CLI, 50 MB for build contexts.

## File link

`file_id`, `url`, `expires_at` (`null` = no expiry). The URL is public. Delete the link to revoke it.

## Store

`name` (required), `access` (`private` | `public_read` | `public_write`), and at creation either `template_id` or `parent_id`. Update `name` and `access`. Deleting fails while a skill or store template is linked.

## Store item

`type`: `directory`, `file` (`file_id`), or `document` (`document_id`), plus a `path`. Changed only through `stores items modify` operations:

| Operation | Keys | Effect |
| --- | --- | --- |
| `add` | `path`, optional `fileId` or `documentId` | Folder (no content) or item. The parent folder must exist. |
| `modify` | `itemId`, plus `path` and/or `fileId` / `documentId` | Move, rename, or replace content |
| `remove` | `itemId` only | Delete. Folders must be empty. |

Without `type`, Metorial infers it: no `itemId` → add, `itemId` alone → remove, `itemId` with more → modify. Limits: 500 operations per call, 1,000 items per store. Paths must be unique.

## Document

`title`, `content` (Markdown). Each update creates a version (`documents versions list|get`). Filter with `--store-id`, `--file-id`, or `--parent-document-id`. Documents are CLI or raw API only, with no dedicated MCP tool.
