# Chat resources

```
Chat connection (one chat provider) ── Chat instance (a bot; provider + optional identity)
                                          └ Chat (one per connected tenant)
                                              ├ Workspace ── Channels ── Threads ── Messages
                                              ├ Authors (users and bots)
                                              └ Chat events
```

## Chat connection

`name` (required), `description`, `metadata`, `private_metadata` (never returned), `provider { provider_id*, provider_deployment_id, provider_auth_method_id, provider_auth_credentials_id, provider_config_id, name, description, metadata }`. Status: `active`, `archived`, `deleted`. The provider must implement the chat adapter.

## Chat instance

`chat_connection_id` (required), `name`, `description`, `metadata`, `private_metadata`, `identity_id` or `identity_actor_id`. Status: `draft` (no provider yet), `active`, `archived`, `deleted`. Its single provider: `chat instances provider get|set` (`provider_id*`, `provider_deployment_id`, `provider_config_id`, `provider_auth_config_id`) and `chat instances provider authenticated-user`. `chat instances sync` refreshes workspaces.

## Chat

One connected surface, such as a Slack or Teams tenant, running on an instance. `chat chats list|get`, filterable by `chat_instance_id`, `chat_connection_id`, `status`, `search`.

## Workspace, channel, thread

Workspaces group channels on providers that have them (`chat workspaces list|get`). Channels (`chat channels list|get`, filter by `workspace_id`, `type`, `search`, `has_access`) have members (`chat channels members list|get`) and a typing indicator (`chat channels typing start`). Threads (`chat threads list|get`) hang off a channel.

## Message

Send with `channel_id*`, `parts*` (for example `[{"type":"text","content":"…"}]`), `thread_id`, `alt_text`, `attachments[{file_id}]`, `reply_message_id`, `ephemeral_target_user_id`. Update with `parts` and `alt_text`. Delete. Mark read. Reactions (`chat messages reactions list|create|delete`) take an `emoji` shortcode such as `tada`.

## Chat event

`chat events list|get`, filterable by `chat_id`, `chat_connection_id`, `chat_instance_id`, `type`, `occurred_at`. Types: `chat.message.received|updated|deleted`, `chat.mention.received`, `chat.reaction.added|removed`, `chat.member.joined|left`, `chat.command.invoked`. Webhook delivery uses an event listener of `type: chat`.
