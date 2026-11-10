# Portal resources

```
Portal
├─ Consumer group (one may be default)
│  └─ Access rule  → provider template | Magic MCP server | skill | skill template
│                    | skill group | skill marketplace | skill plugin
├─ Consumer invite (name, email, message)
└─ Consumers (instance-wide) ── surfaces/profiles ── consumer actor
                                   │ connects a provider template
                                   ▼
             own integration instance + Magic MCP server (source: consumer_provider_template)
```

## Portal

`name`, `description`, `allowed_redirect_url_filters`, `session_expiry_time_in_seconds`, `allow_consumer_skill_authoring`, `allow_consumer_skill_publishing`, and (update only) `skill_configuration { allow_scripts, allowed_file_extensions, allow_non_standard_directories }`. Create, update, list, get. Branding, domains, and SSO live in the dashboard.

## Consumer group

`name`, `description`, `is_default`. The unit access rules target. `delete` archives.

## Access rule

| Field | Meaning |
| --- | --- |
| `consumer_group_id` | Who gets access |
| `access` | `{ type, …id }`, see the table in [SKILL.md](https://skills.metorial.com/metorial-portals/SKILL.md#publish-tools-to-groups) |
| `name`, `description`, `readme` | Listing text shown to consumers (updatable) |

The target is fixed after creation. `delete` removes access for the group.

## Provider template

A catalog item built from an integration: `name`, `description`, `metadata`, `integration_id`. Raw API only (`/provider-templates`: list, get, create, update, delete, which archives). Consumers who connect it get their own integration instance of that integration. Magic MCP servers created from it have `provider_management_mode: inherited_from_provider_template`.

## Consumer invite

`name`, `email`, optional `message`. Emails a sign-in link to the portal. List and get invites per portal.

## Consumer

An end user, instance-wide: `name`, `email`. `consumers create` creates or links by email. Each consumer has a `consumer` identity actor and one profile per **surface** (portal web UI, consumer CLI, chat), readable with `consumers surfaces list|get`. Profile IDs (`consumer_profile_id`) appear on Magic MCP servers, endpoints, sessions, and tool calls.

## Requests from consumers

`metorial request-access` lets a consumer ask for an item outside their groups. Admins review requests in the dashboard and grant access with a new access rule.
