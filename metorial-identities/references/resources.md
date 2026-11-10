# Identity resources

```
Identity actor (person | agent | organization_member | consumer)
└─ owns Identity (active | archived)
      └─ Identity credential (active | archived)   deployment + config + auth config (+ delegation config)

Delegation: identity → delegatee actor, permissions, expiry, overrides
   status: waiting_for_consent | active | denied | revoked | expired
Delegation config: sub-delegation policy (allow | deny | require_consent, depth)
Delegation request: requester asks → pending | approved | denied | canceled
```

## Identity actor

| Field | Meaning |
| --- | --- |
| `type` | `person`, `agent` (you create these), `organization_member`, `consumer` (created by Metorial) |
| `name`, `description`, `metadata` | Labels |
| Links | `agent_id`, `consumer_id`, `consumer_profile_id` filters on `identity actors list` |

Actors own identities, integration instances (`identity_actor_id`), and resources with an `access.owner`. `delete` archives.

## Agent (read-only here)

`identity agents list|get` reads Metorial agents in the instance. Each has an actor, so agents can own identities and receive delegations.

## Identity

`actor_id` (owner, required), `name`, `description`, `metadata`, and optional `credentials[]` at creation. Referenced as `identity_id` by provider and integration setup sessions, integration instances, and session and tool call filters. `delete` archives.

## Identity credential

One usable connection: `identity_id` (required), `deployment_id`, `config_id`, `auth_config_id`, `delegation_config_id`. Created directly, or automatically when a provider setup session bound to the identity completes (`identity_credential_id` on the session). Only `delegation_config_id` is updatable. Replace a credential to change the account.

## Delegation

| Field | Meaning |
| --- | --- |
| `identity_id`, `delegatee_actor_id` | Required |
| `delegator_actor_id` | Who granted it, if not the owner |
| `permissions` | `provider:read`, `provider:call` |
| `expires_at` | Optional end |
| `delegation_config_id` | Policy for re-delegation |
| `credential_overrides[]` | `{ credential_id, permissions, expires_at }` per credential |
| `note`, `metadata` | Context |

`status` starts as `active`, or `waiting_for_consent` when policy requires the owner's consent. A denied delegation records a reason (for example `request_denied` or `sub_delegation_depth_exceeded`). `revoke` ends it immediately.

## Delegation config

`sub_delegation_behavior` (`allow`, `deny`, `require_consent`), `sub_delegation_depth`, `name`, `description`. Attach it to credentials or delegations. `delete` archives.

## Delegation request

`identity_id`, `requester_actor_id`, `expires_at` (required), `permissions`, `delegator_actor_id`, `delegation_config_id`, `credential_overrides`, `note`. Approving creates the delegation. `approve` / `deny` accept `allow_deleted` for requests that were already removed.
