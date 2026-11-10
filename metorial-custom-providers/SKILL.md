---
name: metorial-custom-providers
description: Bring your own MCP server to Metorial as a custom provider. Covers linking a remote MCP server URL, deploying a container image, deploying code as a hosted function (Node.js or Python, from files or a git repository), defining a config schema, publishing new versions, reading build status and logs, and promoting or rolling back versions between instances. Use this whenever the user wants to host, register, link, deploy, update, or roll back their own MCP server or internal API on Metorial, or a build of a custom provider failed, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial custom providers

A **custom provider** registers your own MCP server with Metorial. Every successful build creates a normal **provider version**, so after the first build you deploy and use it exactly like a catalog provider ([metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)).

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-custom-providers/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-custom-providers/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`custom-providers versions create` → `custom_providers_versions_create`). The source is the nested `from` object, so the CLI passes it with `--body`, and MCP passes it as the `from` input. All commands: [references/commands.md](https://skills.metorial.com/metorial-custom-providers/references/commands.md).

## Choose a type

| Type | Use when | `from` |
| --- | --- | --- |
| `remote` | The server already runs somewhere with an MCP endpoint | `{ "type": "remote", "remote_url": "https://…/mcp", "protocol": "streamable_http" }` (`sse`, `streamable_http`, or `stateless`; optional `oauth_config`) |
| `container` | You have an image | `{ "type": "container", "image_ref": "ghcr.io/acme/mcp:1.2.0", "username": "…", "password": "…" }` (credentials only for private registries) |
| `function` | You have source code and want Metorial to host it | `{ "type": "function", "runtime": { "identifier": "nodejs", "version": "24.x" }, "env": {}, "files": [{ "filename": "index.ts", "content": "…" }] }`, or `repository` instead of `files` |

Function runtimes: `nodejs` `24.x` / `22.x`, `python` `3.14` / `3.13` / `3.12`. `files[].encoding` is `utf-8` (default) or `base64`. `repository` is either `{ "repository_id", "branch", "path" }` (a connected SCM repository) or `{ "type": "git", "repository_url", "branch", "path" }`.

## Create and build

```bash
metorial-admin custom-providers create --name "Acme internal API" \
  --body '{"from":{"type":"remote","remote_url":"https://mcp.acme.dev/mcp","protocol":"streamable_http"}}'
```

Creating it starts the first build. Then:

1. `custom-providers deployments list --custom-provider-id <id>` and `deployments get <id>` until `status` is `succeeded` (`queued → deploying → succeeded | failed`).
2. On failure, read `custom-providers deployments get-logs <deployment-id>`, fix the source, and create a new version.
3. Read `provider_id` from `custom-providers get <id>`. That is the provider to deploy: `providers deployments create --provider-id <provider_id>`.

For function sources, build the `files` array from the project directory (including `package.json` or `requirements.txt`). Use `--body-file` for anything larger than a few lines:

```bash
metorial-admin custom-providers create --name "Acme tools" --body-file ./custom-provider.json
```

## Publish a new version

```bash
metorial-admin custom-providers versions create --custom-provider-id <id> --body-file ./from.json
metorial-admin custom-providers versions list --custom-provider-id <id>
```

Version `status`: `queued`, `deploying`, `deployment_succeeded`, `deployment_failed`. A successful version becomes the current version in this instance's **environment**. Deployments that follow the latest version pick it up. Pinned deployments keep their `locked_provider_version_id` until you change it.

`custom-providers versions get-env <version-id>` shows the environment variables a function version runs with.

## Config schema

To accept per-deployment settings, pass `config` on create or version create:

```json
{ "schema": { "type": "object", "properties": { "region": { "type": "string" } } },
  "transformer": "…code that maps config into the server's env/args…" }
```

Users then supply values through provider configs or setup sessions like any other provider.

## Promote between instances

Each instance a custom provider exists in is one of its **environments** (each has `instance_id` and `current_provider_version_id`). Build in staging, then promote the exact same version to production without rebuilding:

```bash
metorial-admin custom-providers environments list --custom-provider-id <id>
metorial-admin custom-providers commits create --message "Release 1.4" \
  --body '{"action":{"type":"merge_version_into_environment","from_environment_id":"<staging-env>","to_environment_id":"<prod-env>"}}'
```

Roll back an environment to an earlier version (instant, no rebuild):

```bash
metorial-admin custom-providers commits create --message "Rollback" \
  --body '{"action":{"type":"rollback_commit","environment_id":"<env>","version_id":"<version>"}}'
```

`custom-providers commits list` is the release history. Confirm promotions and rollbacks to production with the user first.

## Archive

`custom-providers archive <id>` disables new connections. Existing deployments, integrations, and Magic MCP servers that use it stop working for new sessions, so check where its `provider_id` is used first and confirm with the user.

## Gotchas

- Registry passwords, `env` values, and remote `oauth_config` are secrets. Read them from files or environment variables the user controls, never from chat.
- A remote server that requires end-user OAuth surfaces auth methods after discovery. Connect accounts through a provider setup session as usual.
- Wrong `protocol` is the most common remote failure. Try `streamable_http` first, then `sse` for older servers.
- `update` changes only the name, description, readme, and metadata. Source changes always need a new version.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-custom-providers/references/resources.md): custom provider, version, deployment, environment, commit
- [references/commands.md](https://skills.metorial.com/metorial-custom-providers/references/commands.md): generated CLI ↔ MCP table
