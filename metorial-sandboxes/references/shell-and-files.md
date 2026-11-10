# Shells and files on a machine

The CLI opens live connections to a running machine. Run `sandbox machines start <id>` first if it is paused or hibernated. Over MCP there is no live connection, so use `sandbox_machines_exec` ([below](#over-mcp)).

## Shell

```bash
metorial-admin sandbox machines shell <machine-id>                                   # interactive, full TTY, resumes after network drops
metorial-admin sandbox machines shell <machine-id> -- python --version                # one command, exits with its exit code
metorial-admin sandbox machines shell <machine-id> --cwd /app -e NODE_ENV=test -- npm test
cat setup.sh | metorial-admin sandbox machines shell <machine-id> -- bash -s          # pipe a local script
```

`-t` forces a TTY, `-T` disables it. Repeat `-e` per variable.

## Files

Remote paths are absolute. `-` as the local path means stdin or stdout. `-r` copies like `cp -r`.

```bash
metorial-admin sandbox machines files ls <machine-id> /app -r --max-depth 2
metorial-admin sandbox machines files stat <machine-id> /app/package.json
metorial-admin sandbox machines files cat <machine-id> /app/package.json
metorial-admin sandbox machines files upload <machine-id> ./src /app/src -r
echo hello | metorial-admin sandbox machines files upload <machine-id> - /tmp/hello.txt
metorial-admin sandbox machines files download <machine-id> /app/output ./output -r
metorial-admin sandbox machines files mkdir <machine-id> /app/logs
metorial-admin sandbox machines files mv <machine-id> /app/old.txt /app/new.txt
metorial-admin sandbox machines files rm <machine-id> /app/tmp -r
```

- Uploads create parent folders. Recursive transfers run in parallel, keep file modes, and recreate symlinks.
- `upload --mode 0755`, `upload --no-overwrite`, `rm -f` (ignore missing), `mv --overwrite`, `ls --limit` (default 10,000).
- `--ttl-seconds` on `files` sets the lifetime of the underlying access token (default 3600).

## Over MCP

`sandbox_machines_exec { machine_id, command, cwd?, env?, timeout_seconds? }` runs `/bin/sh -c` non-interactively and returns the exit code, stdout, and stderr. It starts the machine if needed. Use it for file work too:

| Goal | `command` |
| --- | --- |
| List | `ls -la /app` |
| Read | `cat /app/package.json` |
| Write a small text file | `mkdir -p /app && cat > /app/config.json <<'EOF'` … `EOF` |
| Write binary or large files | Upload with `files_upload`, then fetch it inside the machine from a URL you control, or use a mounted disk prepared elsewhere |
| Long jobs | `nohup ./job.sh > /tmp/job.log 2>&1 &`, then poll `tail /tmp/job.log` (each call is capped at 300 seconds) |

For a custom client, `sandbox_machines_access_shell` and `sandbox_machines_access_files` return short-lived tokens and URLs for the shell and file services. The wire protocol is documented at https://metorial.com/docs/build/sandboxes/wire-protocol.
