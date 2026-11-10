# Access model

Who can use which external accounts, and how clients prove it. There are three separate questions:

1. **Who administers Metorial?** Organization members and API keys.
2. **Whose external account does a tool call use?** Actors, identities, credentials, and delegations.
3. **Who may connect to a hosted MCP server or catalog?** Magic MCP tokens, consumers, and portals.

## Administering Metorial

| Credential | Scope | Used by |
| --- | --- | --- |
| OAuth sign-in (CLI profile, admin MCP connection) | One organization, with the member's roles | People and agents working with `metorial-admin` or `mcp.metorial.com/mcp` |
| Organization management token | Whole organization, every instance | CI and automation across instances |
| Instance secret key `metorial_sk_…` | One instance, server side | Backends, SDKs, CI for one environment |
| Instance publishable key `metorial_pk_…` | One instance, limited and safe to expose | Frontends |

Members, teams, roles, and policies are managed in the dashboard. API keys: [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md).

## Whose account a tool call uses

```
Actor (person | agent | organization_member | consumer)
└─ Identity           a named set of external access, owned by exactly one actor
   └─ Identity credential   deployment + config + auth config (+ delegation config)
         ▲
Delegation            owner lets another actor use the identity (provider:read, provider:call), optionally until a date
```

- **Actor**: anything that acts. You create `person` and `agent` actors. Metorial creates `organization_member` and `consumer` actors for members and consumers.
- **Identity**: "the accounts Alice can use." Owned by one actor, it holds credentials.
- **Identity credential**: one concrete, ready-to-use connection. It binds a provider deployment, config, and auth config to the identity.
- **Delegation**: grants another actor `provider:read` and/or `provider:call` on an identity, optionally time-limited and with per-credential overrides. Revoke it anytime.
- **Delegation config**: the policy for re-delegation. `sub_delegation_behavior` is `allow`, `deny`, or `require_consent`, with a maximum `sub_delegation_depth`.
- **Delegation request**: an actor asks for access, and the owner approves or denies it. Required when policy says `require_consent`.

Identities and actors also own integration instances (`identity_id`, `identity_actor_id`) and Magic MCP servers. Use them whenever more than one person or agent connects their own accounts.

Skill: [metorial-identities](https://skills.metorial.com/metorial-identities/SKILL.md)

## Ownership on resources

Integration instances, Magic MCP servers and endpoints, and skills carry an `access` block:

- `type`: `public`, or `owner_locked` (only the owner may change it)
- `visibility`: `anyone`, or `owner`
- `owner`: the owning actor

## Connecting to hosted MCP servers

| Mechanism | Grants | Created by |
| --- | --- | --- |
| **Magic MCP token** | Connect to one Magic MCP server *or* one endpoint, plus any number of groups | `metorial-admin magic-mcp tokens create` (CLI only, because it returns the secret) |
| **Instance API key** | Connect to any Magic MCP server in the instance | `metorial-admin api-keys create` |
| **Portal sign-in** | A consumer's access to what their consumer groups allow | The consumer signs in to the portal (SSO or invite) |

Token secrets are shown once. Send them as `Authorization: Bearer <secret>`, or as `?key=<secret>` for clients that can't set headers.

## Consumers and portals

For employees or customers who use tools but don't administer Metorial.

```
Portal                 branded catalog and sign-in (web, the `metorial` CLI, chat)
├─ Consumer group      e.g. "Engineering", "Support"; one can be the default for new consumers
│  └─ Access rule      what the group gets: provider template, Magic MCP server, skill,
│                      skill template, skill group, skill marketplace, or skill plugin
├─ Consumer invite     email invitation to join
└─ Consumer            an end user (name + email), with one profile per surface
```

- A **provider template** is a catalog item built from an integration (`integration_id`). Consumers connect their own accounts to it, which creates their own integration instance and Magic MCP server behind the scenes.
- Each consumer has a `consumer` actor, so their connections are governed like any other identity.
- Consumers use the portal web UI or the consumer CLI (`metorial`), not `metorial-admin`.

Skill: [metorial-portals](https://skills.metorial.com/metorial-portals/SKILL.md)
