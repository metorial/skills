# Integration resources

```
Integration (settings, versioned, status active | archived)
└─ Integration provider        provider + deployment + auth method/OAuth app + config + tool filters + callbacks
      │
Integration instance (owner, status draft | active | archived)
└─ Instance provider           per provider: auth config, config, tool filters
      │
      ├─ Shared session template → sessions
      ├─ Magic MCP server (provider_management_mode: inherited_from_integration)
      └─ Callback instance       one per callback × instance

Integration setup session ──creates/completes──► integration instance
Callback ── per integration provider ──► callback instances ──► callback events
```

## Integration

| Field | Meaning |
| --- | --- |
| `name`, `description`, `metadata` | Labels |
| `can_attach_custom_tool_filters` | Instance providers may add filters that narrow the integration provider's |
| `can_override_tool_filters` | Instance filters may replace the parent filters entirely. Implies attach. |
| `can_attach_custom_provider_config` | Instances may use their own provider config |
| `use_integration_name_in_tool_names` | Prefix exposed tool names with the integration name |
| `enable_callback_tools` | Sessions built from instances get callback event tools |

Create, update, list, get. There is no delete command. Changes are versioned.

## Integration provider

| Field | Meaning |
| --- | --- |
| `integration_id`, `provider_id`, `provider_deployment_id` | Required |
| `provider_auth_method_id` | Which auth method users connect with |
| `provider_auth_credentials_id` | Your OAuth app, when the provider can't auto-register one |
| `provider_config_id` | Default config |
| `tool_filters` | Allowed tools for every instance |
| `callbacks.status` | `enabled` / `disabled`: deliver trigger events |

`delete` archives it. Updates create a new version, and instances follow.

## Integration instance

| Field | Meaning |
| --- | --- |
| `integration_id`, `name` | Required |
| `identity_actor_id`, `identity_id` | Owner |
| `providers[]` | `{ provider_id, provider_config_id, provider_auth_config_id, tool_filters }` per provider |
| `status` | `draft` (missing connections), `active`, `archived` |
| `access` | Ownership block (`public` / `owner_locked`, visibility, owner) |

`create_session` starts a session from the instance's shared session template. `create_template` creates or refreshes that template. `delete` archives the instance.

## Tool filter layering

Filters stack from the top down. Each layer narrows the one above:

1. Integration provider `tool_filters`
2. Instance provider `tool_filters` (only if `can_attach_custom_tool_filters` or `can_override_tool_filters`)

An instance filter marked as an override replaces the parent filters, and only when `can_override_tool_filters` is true. With no filters at any layer, every tool is exposed.

## Integration setup session

| Field | Meaning |
| --- | --- |
| `integration_id`, `name` | Required |
| `integration_instance_id` | Reuse this instance. Its configs and auth configs are overwritten on success. |
| `identity_actor_id`, `identity_id` | Owner of the created instance |
| `redirect_url`, `expires_at` | Flow control |
| `configuration` | `provider_search`, `tool_filters.enabled`, `ui.layout` |

Output: `url` (send to the user), `status` (`pending`, `successful`, `expired`), `steps[]` (one per provider, each with its own `url`, `provider`, `provider_setup_session_id`), and `integration_instance`.

## Callback

| Resource | Meaning |
| --- | --- |
| Callback | Enabled trigger delivery for one integration provider. Name and description are editable. Everything else derives from the integration provider. |
| Callback instance | The registration for one integration instance. Check its status when events don't arrive. |
| Callback event | One delivered trigger payload, filterable by `provider_trigger_key`, status, source, and time |

Only providers whose type reports triggers as enabled support callbacks. Deleting a callback disables it on the integration provider and removes all callback instances.
