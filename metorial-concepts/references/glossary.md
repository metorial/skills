# Glossary

Metorial terms A–Z. The CLI command group and MCP tool prefix are in parentheses.

**Actor** (`identity actors`, `identity_actors_*`): an entity that acts. Types: `person`, `agent`, `organization_member`, `consumer`. Owns identities.

**Alert** (`monitoring alerts`): a finding raised by a monitor, such as a prompt-injection attempt or a provider schema change. It can be resolved, unresolved, or marked viewed.

**API key** (`api-keys`, `api_keys_*`): a credential for the Metorial API. Types: organization management token, instance secret key (`metorial_sk_`), instance publishable key (`metorial_pk_`). Creating, rotating, and revealing keys is CLI only.

**Auth config** (`providers auth-configs`, `providers_auth_configs_*`): one user's connection to a provider, holding their OAuth tokens or API key. Usually created through a setup session.

**Auth credentials** (`providers credentials`, `providers_credentials_*`): your OAuth app registration for a provider (client ID, client secret, scopes). Shared by many auth configs.

**Auth method**: one way a provider version authenticates (OAuth, API token, or custom). Read it from the provider version.

**Callback** (`callbacks`, `callbacks_*`): delivers a provider's trigger events (for example "issue created") for an integration provider whose `callbacks.status` is `enabled`. Callback instances exist per integration instance. Callback events are the delivered payloads.

**Chat connection** (`chat connections`, `chat_*`): links a Slack or Microsoft Teams workspace so agents and skills can operate in chat. Chat instances, workspaces, and events hang off it.

**Config** (`providers configs`, `providers_configs_*`): non-secret settings for a provider deployment, created from a value or a config vault.

**Config vault** (`providers vaults`, `providers_vaults_*`): saved, reusable configuration values that can include secrets. Configs and template providers can reference one.

**Consumer** (`consumers`, `consumers_*`): an end user of a portal or the consumer CLI. Has a profile per surface (web, CLI, chat). Not an organization member.

**Consumer group** (`portals groups`, `portals_groups_*`): a set of consumers in a portal, the unit that access rules target. One group can be the default.

**Custom provider** (`custom-providers`, `custom_providers_*`): your own MCP server (type `container`, `remote`, or `function`). Each successful build creates a provider version. Has versions, deployments (builds), environments, and commits.

**Delegation** (`identity delegations`, `identity_delegations_*`): permission for one actor to use another's identity (`provider:read`, `provider:call`), optionally time-limited.

**Delegation config / request**: the re-delegation policy (`allow`, `deny`, `require_consent`; depth). A request asks the owner for a delegation, and the owner approves or denies it.

**Deployment**: see *Provider deployment*. A *custom provider deployment* is a build job, not a runnable deployment.

**Document** (`documents`, CLI only): a text document backed by a store, for retrieval and context.

**Endpoint** (`magic-mcp endpoints`, `magic_mcp_endpoints_*`): one MCP URL that combines several Magic MCP servers (each with its own tool filters).

**Environment**: a custom provider's presence in one instance, with its current version. Commits promote versions between environments, so a custom provider can move from a staging instance to a production instance.

**Event destination / listener** (`events destinations|listeners`): a webhook endpoint for Metorial events, and a subscription that routes an instance's resource, callback, or chat events to it. Organization-level.

**File** (`files`, `files_*`): an uploaded blob (up to 5 MB through MCP; larger through the CLI). *File links* make a file publicly downloadable.

**Firewall / network policy / enclave** (`network`): egress and ingress controls for providers and sandbox machines. Enclaves are private networks. The internet gateway logs traffic.

**Identity** (`identity`, `identity_*`): a named collection of external access owned by one actor, holding identity credentials.

**Identity credential** (`identity credentials`): binds a provider deployment, config, and auth config to an identity.

**Instance** (`instance`, `instance_*`): an isolated environment (production, staging) inside a project. Holds almost every resource. Not an *integration instance*.

**Integration** (`integrations`, `integrations_*`): an approved, versioned bundle of integration providers with rules for what instances may customize.

**Integration instance** (`integrations instances`): an integration materialized for one owner with their config and auth config. Status `draft`, `active`, or `archived`.

**Integration provider** (`integrations providers`): one provider inside an integration. It fixes the deployment, auth method or credentials, config, tool filters, and callbacks.

**Integration setup session** (`integrations setup`, `integrations_setup_sessions_*`): a hosted URL where a user connects every provider of an integration. Creates or completes an integration instance.

**Listing** (`providers listings`): a provider plus marketplace metadata, used to browse the catalog.

**Magic MCP group** (`magic-mcp groups`): a set of Magic MCP servers. Tokens bound to a group reach all its servers.

**Magic MCP server** (`magic-mcp servers`, `magic_mcp_servers_*`): a permanent hosted MCP URL backed by a session template. Created from an integration instance, a provider template, or manually.

**Magic MCP session**: the session Metorial creates on a Magic MCP server's first connection and reuses afterwards.

**Magic MCP token** (`magic-mcp tokens`): a secret that authorizes MCP clients to connect. Linked to one server or one endpoint, plus groups. Created through the CLI only.

**Monitor** (`monitoring monitors`): watches sessions and providers for issues such as prompt injection and schema changes, and raises alerts.

**Organization**: the top-level account, with members, billing, projects, API keys, event destinations, and outposts.

**Outpost** (`outposts`): a connector that runs in your network so Metorial can reach private services. Organization-level.

**Portal** (`portals`, `portals_*`): a branded, SSO-protected catalog where consumers find and connect approved tools and skills.

**Portal access rule** (`portals access`): grants a consumer group a provider template, Magic MCP server, skill, skill template, skill group, skill marketplace, or skill plugin.

**Project**: groups the instances of one application. Created in the dashboard.

**Provider** (`providers`, `providers_*`): a read-only, versioned definition of a service's tools, triggers, auth methods, and config schema.

**Provider deployment** (`providers deployments`, `providers_deployments_*`): a provider made runnable, with an optional locked version, default config, and tool filters.

**Provider run** (`sessions runs`): one execution of a provider within a session, with logs.

**Provider setup session** (`providers setup-sessions`): a hosted OAuth or form flow that creates an auth config and/or config for one provider.

**Provider template**: a portal catalog item built from an integration. Consumers connect their own accounts to it. Managed with raw API calls on `/provider-templates`.

**Provider version / specification**: a pinned snapshot of a provider. The specification lists its tools, auth methods, and config fields.

**Sandbox machine** (`sandbox machines`, `sandbox_*`): an isolated VM for running code. It can be running, paused, or hibernated, and is built from images and disks.

**Session** (`sessions`, `sessions_*`): a runtime that exposes tools from one or more session providers and records messages, tool calls, runs, events, and errors.

**Session template** (`sessions templates`): a reusable recipe for sessions.

**Skill** (`skills`, `skills_*`): a packaged workflow for agents: instructions, files, sub-agents, and attached integrations or providers. Versioned, with groups, templates, merge requests, plugins, and marketplaces. Called *Magic Skills* in the dashboard.

**Store** (`stores`): a searchable storage space for documents and data.

**Tool**: one callable action of a provider (`search_issues`). Exposed through sessions and Magic MCP servers, and restricted with tool filters.

**Tool call** (`sessions tool-calls`): one recorded invocation of a tool in a session. Can also be created directly with `sessions_tool_calls_create`.

**Tool filter**: JSON limiting which tools, resources, or prompts are exposed (`tool_keys`, `tool_regex`, `tool_categories`, …). Accepted on deployments, integration providers, instances, sessions, templates, Magic MCP servers, and endpoints.

**Trigger**: an event a provider can emit (for example "message posted"), delivered through callbacks.

**Workforce**: the dashboard area for portals, consumers ("accounts"), agents, identities, and skills.
