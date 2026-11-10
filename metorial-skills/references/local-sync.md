# Sync a skill as a local folder

`pull`, `push`, and `status` work the same in `metorial-admin skills` (every skill in the instance) and in the consumer CLI `metorial skills` (skills the portal gives you). They need a filesystem, so they are CLI only. Over MCP, use `skills_files_list|get|put|move|delete|batch`.

## Workflow

```bash
metorial-admin skills pull <skill-id-or-slug> ./my-skill   # download every file
metorial-admin skills status ./my-skill                    # local and remote changes since the pull
metorial-admin skills push ./my-skill --dry-run            # preview
metorial-admin skills push ./my-skill                      # upload local changes
```

- `pull` into a folder that has local changes, or that isn't empty, fails unless you pass `--force`, which overwrites them.
- `pull` records each file's version in `.metorial/skill.json`. Keep that folder. It is how `push` detects conflicts.

## Conflict safety

- Before each batch of up to 100 changes, `push` checks that none of the files it touches changed remotely, and each change carries the recorded version as a precondition. Edits someone made in the dashboard meanwhile are never silently overwritten.
- On a conflict, `push` stops. Pull again to merge the remote changes, or use `--force` to overwrite them, but only when the user agrees to discard the remote edits.
- Batches are not atomic. If the server rejects a change mid-batch, earlier changes stay applied and are recorded locally, so `status` shows what's left.
- `push` never deletes `/SKILL.md`.
- Markdown files become collaboratively editable documents. Other files are uploaded as-is (subject to the skill configuration's allowed extensions and script policy).

## Ignored paths

Never synced: `.git`, `.metorial`, `.DS_Store`, `node_modules`, `.idea`, `.vscode`, `.env`, `.env.*`, `*.swp`, `*~`, and `.metorial-*` temporary files.

Add up to 30 more patterns in `.metorialignore` at the skill root, one per line:

- A pattern without `/` matches any file or folder name anywhere (`drafts`, `*.log`).
- A pattern with `/` (including a leading `/`, as in `/drafts`) is matched from the skill root.
- A matching folder ignores everything under it. A trailing `/` is ignored.
- Go `path.Match` syntax: no `**`, no negation.
- More than 30 patterns makes `pull`, `push`, and `status` fail until trimmed.

`.metorialignore` is itself synced, so everyone who pulls gets the same rules. You can create it in an empty folder before the first `pull`.

## Typical agent loop

1. `skills pull <skill> ./work`
2. Edit `SKILL.md` and its references.
3. `skills status ./work` → `skills push ./work --dry-run` → show the user the diff summary.
4. `skills push ./work`
5. `skills versions list <skill-id>` to confirm a new version exists.
