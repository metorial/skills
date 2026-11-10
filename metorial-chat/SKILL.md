---
name: metorial-chat
description: Build chat bots on Metorial that live in Slack, Microsoft Teams, and other chat platforms. Covers chat connections (linking a chat provider to the instance), chat instances (a running bot, optionally acting as an identity), chats, workspaces, channels, threads, sending and editing messages, DMs, slash-command responses, and receiving chat events such as messages, mentions, and reactions by webhook or polling. Use this whenever the user wants a Slack or Teams bot, wants an agent to read or post chat messages through Metorial, or asks about chat connections, chat instances, or chat events, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial chat

A **chat connection** links a chat provider (Slack, Microsoft Teams, …) to the instance. A **chat instance** is one running bot on that connection, with its own provider settings and, optionally, an identity it acts as. Each tenant the bot is installed in becomes a **chat** with workspaces, channels, threads, messages, and **chat events** (new message, mention, reaction, member joined, command invoked).

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-chat/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-chat/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`chat instances create` → `chat_instances_create`). All commands: [references/commands.md](https://skills.metorial.com/metorial-chat/references/commands.md).

## Set up a bot

1. **Find a chat-capable provider** and deploy it with an auth method ([metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)). Only providers that implement the chat adapter work. Others fail with `provider_does_not_implement_adapter`.

   ```bash
   metorial-admin providers list --search slack
   ```

2. **Create the connection** with its provider:

   ```bash
   metorial-admin chat connections create --name "Support Slack" \
     --provider '{"provider_id":"<provider-id>","provider_deployment_id":"<deployment-id>","provider_auth_credentials_id":"<oauth-app-id>"}'
   ```

   `provider` also takes `provider_auth_method_id`, `provider_config_id`, `name`, `description`, `metadata`. Use `--private-metadata` for values your code needs but that must never appear in API responses.

3. **Create an instance** (the bot) and give it a provider:

   ```bash
   metorial-admin chat instances create --chat-connection-id <connection-id> --name "Support bot" --identity-id <identity-id>
   metorial-admin chat instances provider set <instance-id> --provider-id <provider-id> --provider-auth-config-id <auth-config-id>
   metorial-admin chat instances get <instance-id>     # draft → active
   ```

   The instance stays `draft` until it has a provider, then becomes `active`. `--identity-id` (or `--identity-actor-id`) makes the bot act as that identity, so its tool access follows the identity's delegations ([metorial-identities](https://skills.metorial.com/metorial-identities/SKILL.md)). The auth config comes from connecting the bot's account with a provider setup session. `chat instances provider get` shows the current provider, and `chat instances provider authenticated-user` shows which account the bot posts as.

4. **Sync and inspect:**

   ```bash
   metorial-admin chat instances sync <instance-id>
   metorial-admin chat workspaces list
   metorial-admin chat chats list --chat-instance-id <instance-id>     # one chat per connected tenant
   metorial-admin chat channels list <chat-id> --search support
   ```

## Receive events

Push them to your webhook (recommended):

```bash
metorial-admin events destinations create --name "Bot webhook" --type webhook --webhook '{"url":"https://bot.example.com/metorial"}'
metorial-admin events listeners create --event-destination-id <destination-id> --type chat --chat-connection-id <connection-id>
```

Store the `signing_secret` from the create response securely. It is shown only once. Verify deliveries as described in [metorial-events-and-monitoring](https://skills.metorial.com/metorial-events-and-monitoring/SKILL.md#verify-webhooks).

Or poll: `chat events list --chat-instance-id <id> --type chat.mention.received`. Event types: `chat.message.received`, `chat.message.updated`, `chat.message.deleted`, `chat.mention.received`, `chat.reaction.added`, `chat.reaction.removed`, `chat.member.joined`, `chat.member.left`, `chat.command.invoked`.

## Send and manage messages

```bash
metorial-admin chat messages create <chat-id> --channel-id <channel-id> --thread-id <thread-id> \
  --parts '[{"type":"text","content":"On it. I will report back in this thread."}]' \
  --alt-text "On it."
```

| Goal | Command |
| --- | --- |
| Reply to a message, attach files | `--reply-message-id <message-id>`, `--attachments '[{"file_id":"<file-id>"}]'` (upload first, purpose `chat_message_attachment`) |
| Message only one user sees | `--ephemeral-target-user-id <user-id>` |
| Edit or delete | `chat messages update <chat-id> <message-id> --channel-id <id> --parts '[…]'`, `chat messages delete <chat-id> <message-id>` |
| Read history | `chat messages list <chat-id> --channel-id <id>` (also `--thread-id`, `--search`), `chat threads list <chat-id> --channel-id <id>` |
| Open a DM | `chat dms open <chat-id> --type single --user '{"type":"email","email":"ada@example.com"}'`, or `--type group --users '{"type":"generic","user_ids":["U1","U2"]}'`. User `type` is `email`, `phone_number`, or `generic` (provider user ID). Send to the returned channel. |
| Answer a slash command | `chat commands respond <chat-id> --chat-event-id <event-id> --parts '[…]'` (`--ephemeral` for only the invoker). Respond within the provider's response window. |
| React | `chat messages reactions create <chat-id> <message-id> --channel-id <id> --emoji tada`, `reactions delete` with the same flags |
| Show typing, mark read | `chat channels typing start <chat-id> <channel-id>`, `chat messages read <chat-id> <message-id> --channel-id <id>` |
| Channel members | `chat channels members list <chat-id> <channel-id>` |

Ask before posting to channels the user didn't name. Messages reach real people.

## Retire

`chat instances delete` and `chat connections delete` archive. An archived instance stops receiving events and rejects updates (`410 gone`). Confirm first.

## Reference

- [references/resources.md](https://skills.metorial.com/metorial-chat/references/resources.md): connection, instance, chat, workspace, channel, thread, message, event, statuses
- [references/commands.md](https://skills.metorial.com/metorial-chat/references/commands.md): generated CLI ↔ MCP table
