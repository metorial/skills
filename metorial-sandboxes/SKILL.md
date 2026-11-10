---
name: metorial-sandboxes
description: Run isolated Linux machines on Metorial Sandboxes for agents to execute code, store files, and serve apps. Covers creating machines from managed or custom images, running commands, opening shells, moving files, sizing, runtime and startup commands, pausing and hibernating idle machines, lifecycle hooks, persistent disks (attach, resize, clone), building images from a Dockerfile, exposing ports with access tokens or publicly, restricting outbound traffic with firewalls, and debugging failed machines with logs, events, errors, and usage. Use this whenever the user wants a sandbox, VM, code execution environment, dev box, or preview server on Metorial, or asks why a machine failed, paused, or is slow, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial sandboxes

A **machine** is an isolated Linux VM with its own CPU, memory, and root disk. It boots from an **image** (managed: Debian, Node.js, Python, Bun, Go, browser automation, and more; or your own Dockerfile), runs in a **region**, can mount **disks** that outlive it, and can sit behind **firewalls** that limit outbound traffic. Idle machines pause or hibernate on their own.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-sandboxes/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-sandboxes/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`sandbox machines exec` → `sandbox_machines_exec`). `sandbox machines shell` and `sandbox machines files` are CLI only. Over MCP, use `sandbox_machines_exec` for commands and file work. All commands: [references/commands.md](https://skills.metorial.com/metorial-sandboxes/references/commands.md).

## Run a machine

```bash
metorial-admin sandbox regions list                                # pick a region, such as iad1
metorial-admin sandbox images list --owner global --search python  # pick an image (sbi_…)
metorial-admin sandbox machines create --region iad1 --image-id <image-id> --name data-agent
metorial-admin sandbox machines get <machine-id>                   # wait for status: running
metorial-admin sandbox machines exec <machine-id> --command "python3 --version"
```

- Machines start right away (`--start=false` to create stopped). Status goes `starting` → `running`. `failed` comes with a `failure.code` (see [debug](#debug-a-machine)).
- `exec` runs `/bin/sh -c <command>` and returns the exit code and output. It starts the machine if needed and times out after 60 seconds by default (`--timeout-seconds`, at most 300). Add `--cwd` and `--env '{"KEY":"value"}'`.
- With a filesystem, use the CLI shell instead: `sandbox machines shell <id> -- npm test` streams output and passes the exit code through. Without `--`, it opens an interactive shell. Details: [references/shell-and-files.md](https://skills.metorial.com/metorial-sandboxes/references/shell-and-files.md).
- `sandbox machines delete <id>` terminates the machine and deletes its root disk. Attached disks stay. Confirm first.

## Size and runtime

```bash
metorial-admin sandbox specs list                                  # predefined sizes and whether your plan allows them
metorial-admin sandbox machines create --region iad1 --image-id <image-id> --memory-gib 4 --cpus 2 \
  --runtime '{"setup":["npm ci --prefix /app"],"entrypoint":["node","/app/server.js"],"env":{"PORT":"3000"},"workdir":"/app"}'
```

| Setting | Values |
| --- | --- |
| Size | `--spec-identifier`, or `--memory-gib` and `--cpus` together (steps of 0.5). Neither gives the default size. |
| `runtime` | `setup` (commands before the entrypoint), `entrypoint`, `cmd`, `env`, `workdir`, `user`, `stop_signal`. Unset fields use the image's defaults. |
| `entrypoint_wait_seconds` | How long startup waits for the entrypoint (default 0) |
| `name`, `metadata` | Your labels, filterable with `machines list --search` |

`machines update` applies names, metadata, lifecycle policy, firewalls, and public ports immediately. Size, runtime, and mounts need a restart: the machine shows `restart_required: true`, a running machine restarts on its own, and `machines restart <id>` applies it now. A restart keeps files and loses processes and memory.

## Pause, hibernate, and hooks

| Action | Effect |
| --- | --- |
| `pause` | Freezes everything, memory included. `start` resumes exactly where it stopped. |
| `hibernate` | Stops compute. Files stay, processes are gone. `start` boots fresh. |
| `start` | Starts a paused or hibernated machine. Call it before connecting. |
| `touch` | Counts as activity, so idle policies wait longer |

Let idle machines hibernate on their own. This suits most agent workloads:

```bash
metorial-admin sandbox machines update <machine-id> \
  --lifecycle-policy '{"pause_after_idle_seconds":null,"hibernate_after_paused_seconds":600,"connection_idle_seconds":300}'
```

- `null` turns a step off. With pausing off, the machine hibernates after `hibernate_after_paused_seconds` of idleness.
- Activity means a shell, file, or port connection with traffic, or `touch`.
- Machines paused for 8 hours or more may be restarted by the platform, so pair pauses with a hibernation policy.
- Hooks run on `start`, `pause`, `resume`, or `terminate`: `{"type":"script","on":"start","path":"/app/restore.sh","arguments":[],"wait":true,"timeout_seconds":60}` or `{"type":"http","on":"pause","port":3000,"path":"/flush","wait":true}`. Set them with `--lifecycle-hooks` or `--lifecycle-hooks-file`. `--ignore-image-hooks` skips hooks the image ships.

Write state to disk, never only to memory, so a hibernated machine comes back on its own.

## Keep data on a disk

```bash
metorial-admin sandbox disks create --region iad1 --name workspace --size-bytes 10737418240   # 10 GiB, same region as the machine
metorial-admin sandbox machines update <machine-id> --mounts '[{"disk_id":"<disk-id>","mount_path":"/data"}]'
metorial-admin sandbox machines restart <machine-id>
```

- `mounts` replaces the whole list. Include every disk to keep, or leave one out to detach it.
- `disks resize <id> --size-bytes …` grows a disk (never shrinks). It briefly stops the machines using it. Track it with `disks resizes list` and `retry` a failed one.
- `disks clone <id> --name …` copies a disk in the same region, for example a prepared repository for several machines.
- Root disks (`disks list --type root_fs --machine-id <id>`) can be resized but not detached, cloned, or deleted on their own.

## Build a custom image

```bash
metorial-admin files upload ./my-image --purpose sandbox_image_build_context   # zips the folder (Dockerfile + context, ≤ 50 MB)
metorial-admin sandbox images create --name python-data-agent
metorial-admin sandbox images builds create <image-id> --file-id <file-id> --build-args '{"PYTHON_VERSION":"3.12"}'
metorial-admin sandbox image-builds get <build-id>    # until succeeded | failed | cancelled | timed_out
metorial-admin sandbox image-builds logs <build-id>
```

Over MCP, upload the archive with `files_upload` (purpose `sandbox_image_build_context`). The image stays `pending` until its first build succeeds. Each build creates a numbered version, and new machines boot from the latest successful one. Also: `--dockerfile-path`, `--context-path`, `--target`, `--timeout-seconds`, `--disk-size-bytes` (root disk size for machines from this version). Bake dependencies into the image rather than `runtime.setup`, so boots stay fast.

## Expose ports and limit traffic

Servers must listen on `0.0.0.0`. Each port gets its own HTTPS URL.

```bash
metorial-admin sandbox machines access ports <machine-id> --ports '[3000]' --ttl-seconds 3600
curl -H "Metorial-Sandbox-Token: <token>" https://<machine-host>.metorial.run/health
metorial-admin sandbox machines update <machine-id> --public-ports '[3000]'     # no token needed
```

- Access tokens last one hour by default, at most 24 hours. `--ports '"*"'` covers every port. The response holds `urls.ports`. Never echo the token back to the user unless they ask for it.
- Public ports are open to anyone with the URL. Put auth in front of anything sensitive.
- Outbound traffic is open until you attach a firewall. Then it is denied unless a rule allows it: create a network policy and firewall ([metorial-network](https://skills.metorial.com/metorial-network/SKILL.md)), then `machines update <id> --firewall-ids <firewall-id>`. It applies without a restart. Private and loopback addresses are always blocked.

## Debug a machine

1. `machines get <id>`: `status`, `failure {code, message}`, `restart_required`, `upcoming_events`.
2. `machines instances list <id>` → `machines instances logs <id> <instance-id> --direction backward --limit 200` for console output (setup, entrypoint).
3. `machines errors list <id>` for failures inside the machine, such as a hook exiting non-zero.
4. `machines operations list <id> --trigger idle_policy` and `machines events list <id> --source policy` explain why it paused, hibernated, or restarted.
5. `machines usage <id>` for live CPU and memory. `usage-history summary|timeline <id> --from … --to …` for trends.

| `failure.code` | Fix |
| --- | --- |
| `start_failed` | A setup command, entrypoint, or hook failed. Read errors and logs, `machines update`, then `machines start`. |
| `image_unavailable` | The image isn't built in that region. Pick another region or image. |
| `disk_unavailable` | A mounted disk is missing or in another region |
| `provision_failed`, `timeout`, `internal_error` | Retry with `machines start`, then try another size or region |

## Reference

- [references/shell-and-files.md](https://skills.metorial.com/metorial-sandboxes/references/shell-and-files.md): CLI shell and file transfer, plus the MCP equivalents
- [references/resources.md](https://skills.metorial.com/metorial-sandboxes/references/resources.md): machine, image, build, disk, region, spec, statuses
- [references/commands.md](https://skills.metorial.com/metorial-sandboxes/references/commands.md): generated CLI ↔ MCP table
