---
name: metorial-network
description: Control network access for Metorial integrations, providers, and sandboxes, and route MCP traffic through your own network. Covers network policies (allow and deny egress rules by CIDR and port), firewalls that bundle policies, assigning firewalls to integration enclaves, providers, the internet gateway, or sandbox machines, the internet gateway's public IPs for allowlisting, network logs, integration enclaves, and outposts (self-hosted proxies that connect your network to Metorial, with access grants and enrollment credentials). Use this whenever the user wants to restrict outbound traffic, allowlist Metorial IPs, inspect network logs, run MCP traffic through their own infrastructure, or set up an outpost, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial network

Provider deployments run in **integration enclaves** and reach the internet through the instance's **internet gateway**. **Network policies** hold allow and deny rules. **Firewalls** bundle policies and apply to enclaves, providers, the internet gateway, or sandbox machines. **Outposts** are proxies you run in your own network that connect out to Metorial, so MCP clients reach Metorial through infrastructure you control.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-network/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-network/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`network firewall-assignments create` → `network_firewall_assignments_create`). `outposts credentials create` is CLI only, because it reveals a secret. All commands: [references/commands.md](https://skills.metorial.com/metorial-network/references/commands.md).

## Allowlist Metorial's IPs

```bash
metorial-admin network internet-gateway get      # public IPs that integration traffic leaves from
```

Give these IPs to services that only accept known addresses, such as a database or an internal API that a custom provider calls.

## Restrict outbound traffic

1. **Create a policy:**

   ```bash
   metorial-admin network policies create --name allow-github --rules '[
     {"effect":"allow","direction":"egress","cidrs":["140.82.112.0/20"],"ports":[{"from":443,"to":443}],"priority":100,"enabled":true,"description":"GitHub over HTTPS"}
   ]'
   ```

2. **Bundle policies into a firewall:**

   ```bash
   metorial-admin network firewalls create --name github-only --network-policy-ids <policy-id>,<policy-id-2>
   ```

3. **Apply it:**

   | Target | Command |
   | --- | --- |
   | One provider, everywhere it runs | `network firewall-assignments create --firewall-id <id> --target-type provider --provider-id <provider-id>` |
   | One enclave (a provider deployment's network) | `--target-type enclave --enclave-id <enclave-id>` |
   | All integration traffic of the instance | `--target-type internet_gateway` |
   | A sandbox machine | `sandbox machines update <machine-id> --firewall-ids <id>` ([metorial-sandboxes](https://skills.metorial.com/metorial-sandboxes/SKILL.md#expose-ports-and-limit-traffic)) |

Rules: once a firewall applies, outbound traffic is denied unless an `allow` rule matches. Overlapping rules resolve by higher `priority`, so a high-priority `deny` carves exceptions out of a broad `allow`. `cidrs` are IP ranges only (no domain names). Omit `ports` to match every port. `enabled: false` turns a rule off. Private, loopback, and link-local addresses are always blocked for sandboxes.

A firewall on the internet gateway affects every integration in the instance. Confirm with the user, and check `network internet-gateway list-network-logs` before and after so nothing they rely on breaks.

## Inspect traffic

```bash
metorial-admin network enclaves list --provider-id <provider-id>
metorial-admin network internet-gateway list-network-logs --direction egress --enclave-id <enclave-id> --from 2026-11-10T00:00:00Z --to 2026-11-10T12:00:00Z
metorial-admin network firewalls list --provider-id <provider-id>      # also --enclave-id, --machine-id
```

Logs filter by `direction` (`ingress` | `egress`), `enclave_id`, `hostname`, `ip`, time range, and `interval_minutes`.

## Run an outpost

An outpost is a process in your network that registers with Metorial using a credential and proxies MCP connections. Use one to inspect, transform, or block MCP traffic before it reaches Metorial, or to reach Metorial from behind NAT with nothing inbound exposed.

```bash
metorial-admin outposts create --name "HQ proxy" --description "MCP traffic for the Berlin office"
metorial-admin outposts access set <outpost-id> --grants '[{"instance_id":"<instance-id>","services":["mcp_connection_proxy"]}]'
metorial-admin outposts credentials create <outpost-id> --name hq-k8s
```

- Grants decide which instances may use the outpost. `mcp_connection_proxy` is required. Add `outpost_registration_proxy` only to nest other outposts behind this one. `access set` replaces all grants, so include existing ones (`outposts access list`).
- The credential (`metorial_op_…`) is shown once. Have the user put it straight into a secret manager as `METORIAL_OUTPOST_CREDENTIAL`, not into the chat. Optional `--expires-at <ISO date>`. An expired credential disconnects the outpost.
- Run the proxy with `@metorial/mcp-proxy` (`McpProxy.create({ outpostCredential, baseUrl, proxy: { port } })`), add middleware to redact arguments or block tools, then containerize and deploy it. Guide: https://github.com/metorial/outpost/blob/main/docs/mcp-proxy/README.md.
- Rotate: create a new credential, deploy it, then `outposts credentials disable` and `delete` the old one.
- Retire: `outposts disable` (required before delete), then `outposts delete`. Confirm first: connected clients drop.

Outposts belong to the organization and are visible across its account family. Only the owning organization can change them.

## Reference

- [references/commands.md](https://skills.metorial.com/metorial-network/references/commands.md): generated CLI ↔ MCP table
