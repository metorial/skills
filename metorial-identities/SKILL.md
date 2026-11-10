---
name: metorial-identities
description: Model who owns which external accounts in Metorial and who may act on their behalf. Covers identity actors (people and agents), identities, identity credentials that bind a provider deployment, config, and auth config to an identity, connecting accounts directly to an identity, delegating an identity to another actor (time-limited, read or call permissions, per-credential overrides), delegation policies for re-delegation, and approving or denying delegation requests. Use this whenever the user wants per-person or per-agent accounts, wants an agent to act for a user, needs to grant, review, or revoke delegated access, or asks which identity a session or tool call ran as, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial identities

**Actors** act: people, agents, organization members, and portal consumers. An **identity** is a named set of external access owned by exactly one actor ("Alice's work accounts"). Its **credentials** are concrete connections, each a provider deployment + config + auth config. **Delegations** let another actor use an identity, optionally time-limited.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-identities/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-identities/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`identity delegations create` → `identity_delegations_create`). All commands: [references/commands.md](https://skills.metorial.com/metorial-identities/references/commands.md). Background: [metorial-concepts access model](https://skills.metorial.com/metorial-concepts/references/access-model.md).

## Set up an actor and identity

```bash
metorial-admin identity actors create --type person --name "Alice Doe"    # or --type agent
metorial-admin identity create --actor-id <actor-id> --name "Alice – work accounts"
```

- You create `person` and `agent` actors. `organization_member` and `consumer` actors are created by Metorial. Find them with `identity actors list --consumer-id <id>` or `--search`.
- `identity agents list|get` reads Metorial agents. Each agent has an actor (`identity actors list --agent-id <id>`).

## Attach accounts (credentials)

Connect the account through a provider setup session bound to the identity, so the user enters secrets in Metorial's UI:

```bash
metorial-admin providers setup-sessions create --provider-id <provider-id> \
  --provider-deployment-id <deployment-id> --identity-id <identity-id> --type auto
```

When it completes, the response's `identity_credential_id` is the new credential. If the auth config already exists, attach it directly:

```bash
metorial-admin identity credentials create --identity-id <identity-id> \
  --deployment-id <deployment-id> --auth-config-id <auth-config-id> [--config-id <config-id>]
```

`identity create` also accepts `credentials[]` (`deployment_id`, `config_id`, `auth_config_id`, `delegation_config_id`) to do both in one call.

To give an identity a bundle of providers at once, run an integration setup session with `--identity-id` ([metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md#connect-an-account-setup-sessions)).

## Delegate

```bash
metorial-admin identity delegations create --identity-id <identity-id> \
  --delegatee-actor-id <agent-actor-id> --permissions provider:read,provider:call \
  --expires-at 2026-12-31T23:59:59Z --note "Support bot acts for Alice"
```

- `provider:read` lets the delegatee see the identity's providers and tools. `provider:call` lets it call tools.
- `--delegator-actor-id` is for when someone other than the owner grants the delegation.
- `--credential-overrides` grants different permissions or expiry per credential: `'[{"credential_id":"…","permissions":["provider:read"]}]'`.
- Revoke with `identity delegations revoke <id>` (immediate). Confirm with the user first.
- Audit with `identity delegations list --identity-id <id>`.

## Delegation policy

A **delegation config** controls re-delegation, meaning whether a delegatee may pass access on:

```bash
metorial-admin identity delegation-configs create --name "No re-delegation" --sub-delegation-behavior deny
```

`--sub-delegation-behavior`: `allow`, `deny`, or `require_consent` (re-delegation needs the owner's approval through a request). `--sub-delegation-depth` caps the chain length. Apply a config to a credential with `identity credentials update <id> --delegation-config-id <id>`, or to a delegation with `--delegation-config-id`.

## Requests and approvals

An actor asks for access, and the owner decides:

```bash
metorial-admin identity delegation-requests create --identity-id <identity-id> \
  --requester-actor-id <agent-actor-id> --permissions provider:call --expires-at 2026-11-17T00:00:00Z
metorial-admin identity delegation-requests list --identity-id <identity-id>
metorial-admin identity delegation-requests approve <request-id>     # or: deny <request-id>
```

Approving creates the delegation. Never approve or deny on the user's behalf without their explicit decision.

## Trace activity by identity

`sessions list --identity-id <id>`, `sessions tool-calls list --identity-id <id>`, and `--actor-id <id>` show what ran under an identity or actor ([metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md)).

## Lifecycle

`identity delete`, `identity actors delete`, `identity credentials delete`, and `identity delegation-configs delete` all archive. Archiving an identity or credential cuts off every delegatee and session that relies on it, so confirm first.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-identities/references/resources.md): actor, agent, identity, credential, delegation, delegation config, delegation request
- [references/commands.md](https://skills.metorial.com/metorial-identities/references/commands.md): generated CLI ↔ MCP table
