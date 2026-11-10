# Sandbox resources

```
Region ─┬─ Machine ── root disk (deleted with the machine)
        │    ├ boots from ── Image ── versions ← builds (Dockerfile context file)
        │    ├ mounts ────── Disk (independent, same region; resize, clone)
        │    ├ firewalls ─── Network firewall ── network policies (egress rules)
        │    └ instances (one per fresh boot) · operations · events · errors · usage
Spec (predefined size)
```

## Machine

`region`, `image_id` (required). Also `name`, `metadata`, size (`spec_id` / `spec_identifier`, or `memory_gib` + `cpus`), `runtime`, `lifecycle_policy`, `lifecycle_hooks`, `ignore_image_hooks`, `entrypoint_wait_seconds`, `mounts[{disk_id, mount_path}]`, `firewall_ids`, `public_ports`, `start`.

- `status`: `starting`, `running`, `pausing`, `paused`, `resuming`, `hibernating`, `hibernated`, `restarting`, `upgrading`, `terminating`, `terminated`, `failed`.
- Read-only fields: `failure {code, message}`, `restart_required`, `root_disk`, `image.version_id`, `last_activity_at`, `pause_at`, `hibernates_at`, `upcoming_events` (next hour).
- `machines list` filters by `--state` (runtime status), `--image-id`, `--region`, and `--search`. `--status deleted` lists terminated machines.
- **Instance**: one run of the machine, numbered from 1. A new one appears on every fresh boot. Its logs are the console output.
- **Operation**: a start, pause, hibernate, restart, or terminate, with its trigger (`api`, `idle_policy`, `paused_policy`, `failure`, …) and outcome.
- **Event**: timeline entry, by `source` (`api`, `policy`, `agent`, `guest`, `system`).
- **Error**: a failure inside the machine, with operation, stage, exit code, and output.
- **Usage**: latest samples (`usage`). History (`usage-history summary|timeline`) keeps minute data 7 days and hourly data 30 days. It is not billing data.

## Image

`name`, `metadata`. `pending` until the first build succeeds, then `active`. `images list --owner global` lists managed images. Versions are numbered, and machines boot from the latest successful one.

## Image build

`file_id` (a context archive uploaded with purpose `sandbox_image_build_context`, ≤ 50 MB), `dockerfile_path` (default `Dockerfile`), `context_path` (default `.`), `target`, `build_args` (names recorded, values not), `timeout_seconds` (default 30 minutes), `disk_size_bytes` (default 16 GiB). Status ends in `succeeded`, `failed` (with `failure`), `cancelled`, or `timed_out`.

## Disk

`region` (required), `name`, `metadata`, `size_bytes`. Types include `root_fs` (a machine's root disk). Grows only. A resize moves through `pending`, `draining`, `resizing`, `verifying`, `restarting`, then `complete` or `failed` (retryable). `disks list --attached=false` finds unused disks. `disks mounts list` shows mount history.

## Region and spec

Regions are where machines, disks, and image versions live. Specs are predefined sizes with memory, CPUs, regions, and `available` (allowed on your plan).

## Access tokens

`access ports` (`ports`: numbers or `"*"`), `access shell`, and `access files` return a short-lived `token`, `urls`, and `expires_at` (`ttl_seconds`, default one hour, at most 24 hours). Send it as the `Metorial-Sandbox-Token` header.
