# Provider resources

What each resource is, the fields that matter, and how it connects to the others. IDs are instance-scoped unless noted.

## Provider (read-only)

A service definition: GitHub, Slack, or a custom provider once built.

| Field | Meaning |
| --- | --- |
| `id`, `slug` | Either works as `provider_id` |
| `access` | `public` (catalog) or `tenant` (yours, such as a custom provider) |
| `status` | `active`, `archived`, `deleted` |
| `current_version` | The latest version. Its `id` feeds version-scoped lists. |
| `oauth.callback_url` | Redirect URI to register in your own OAuth app |
| `oauth.auto_registration.status` | `supported`: Metorial creates the OAuth app. `unsupported`: you supply auth credentials. |
| `publisher` | Who publishes it (Metorial, a vendor, you) |

Related read-only resources:

- **Provider version** (`providers versions`): a snapshot. Deployments can pin one.
- **Provider specification** (`providers specifications`): the full contract of a version: tools with input schemas, auth methods, config fields.
- **Tool** (`providers tools`): one callable action, with key, name, description, input schema, and category. Filter by auth method compatibility.
- **Trigger** (`providers triggers`): an event the provider can emit, delivered through [callbacks](https://skills.metorial.com/metorial-integrations/SKILL.md#callbacks).
- **Auth method** (`providers auth-methods`): one way to authenticate, of type `oauth`, `token`, `service_account`, or `custom`. Some tools work only with some methods.
- **Listing** (`providers listings`): a provider plus marketplace data (verified, official, categories, readme). Use it to browse.
- **Category, collection, publisher**: catalog taxonomy.
- **Provider group** (`providers groups`, writable): your own folders of listings. Add and remove listings with `providers_groups_add_listing` / `_remove_listing`. Setup sessions can limit provider search to groups.

## Provider deployment

The runnable unit, referenced by integrations, sessions, templates, identity credentials, and Magic MCP server providers.

| Field | Meaning |
| --- | --- |
| `provider_id` | Required on create |
| `locked_provider_version_id` | Pinned version, or `null` to follow the latest |
| `provider_config` / `provider_config_id` | Default config: inline `{value}`, `{provider_config_vault_id}`, or an existing config |
| `tool_filters` | Default tool restriction |
| `name`, `description`, `metadata` | Labels |

Lifecycle: create and update. There is no delete command. Stop using a deployment by removing it from integrations and templates.

## Provider config

Non-secret settings matching the provider's config schema (`providers_configs_get_config_schema`).

- Created from `value` (JSON) or `provider_config_vault_id`. Can be scoped to a deployment.
- Create through the CLI (`providers configs create`) or inline on a deployment. Update, read, and delete through either interface.
- Referenced as `provider_config_id` by deployments, integration providers, integration instance providers, session providers, and template providers.

## Provider config vault

Saved configuration values that can include secrets, reused as a template for configs. Create through the CLI only (`providers vaults create --value`). Read, update, and delete through either interface. Values aren't returned.

## Provider auth credentials

Your OAuth app for a provider: `config = { client_id, client_secret, scopes[] }`.

- Needed only when `oauth.auto_registration.status` is `unsupported`, or when you want your own branding and scopes.
- Create and update through the CLI only. List, get, and delete through either interface.
- Referenced as `provider_auth_credentials_id` by setup sessions and integration providers.

## Provider auth config

One account's authentication: OAuth tokens after a completed flow, or a stored API key.

| Field | Meaning |
| --- | --- |
| `provider_auth_method_id` | Which auth method it satisfies |
| `provider_deployment_id` | Optional deployment scope |
| `tool_filters` | Optional restriction on tools for this account |

- Created by a completed provider setup session (or integration setup session), or directly through the CLI with `--value`.
- Referenced as `provider_auth_config_id` by integration instance providers, session providers, template providers, identity credentials, and Magic MCP server providers.
- Secrets are never returned. OAuth tokens refresh automatically.

## Provider setup session

A hosted flow that collects auth and/or config from a user.

| Input | Meaning |
| --- | --- |
| `provider_id`, `provider_deployment_id` | What to connect |
| `provider_auth_method_id`, `provider_auth_credentials_id` | Which method and OAuth app |
| `type` | `auto`, `auth_only`, `config_only`, `auth_and_config`, `admin` |
| `identity_id` / `consumer_id` | Who the result belongs to |
| `redirect_url` | Where the user lands afterwards |
| `configuration` | `provider_search` (limit to groups, collections, categories), `tool_filters.enabled`, `ui.layout` (`box`, `side`, `light`) |

Output: `url`, `status` (`pending` → `completed` / `failed` / `expired`), `error`, and the resulting `auth_config`, `config`, `credentials`, `deployment`, `identity_credential_id`.

## How they fit

```
Provider ── version ── tools / auth methods / triggers / config schema
   │
   ├── Auth credentials (OAuth app) ──┐
   │                                   ▼
   └── Deployment ── config ──► Setup session ──► Auth config (one account)
             │                                         │
             └──────────────► used together by ◄───────┘
                integration providers · session providers · template providers
                Magic MCP server providers · identity credentials
```
