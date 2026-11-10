---
name: metorial-events-and-monitoring
description: Get notified about what happens in Metorial and watch for problems. Covers the event log, webhook event destinations with retry policies and signing secrets, listeners that route resource lifecycle events (such as session.created), integration callback triggers, and chat events to a webhook, verifying webhook signatures, delivery history, audit logs, monitors and alerts for prompt-injection (ProtoGuard) and provider schema changes, and resolving alerts. Use this whenever the user wants webhooks, notifications, an event stream, audit trails, alerting, or to investigate prompt-injection or schema-change alerts on Metorial, with either the metorial-admin CLI or the Metorial admin MCP server.
---

# Metorial events and monitoring

Metorial records **events**: resource lifecycle (`session.created`, …), integration **callback** triggers, **chat** events, and pings. An **event destination** is a webhook URL (organization-wide). A **listener** subscribes a destination to a slice of events for an instance. **Monitors** watch for prompt-injection (ProtoGuard) and provider schema changes and raise **alerts**.

> **Not installed locally?** Fetch any file referenced here from `https://skills.metorial.com/metorial-events-and-monitoring/<path>` (mirror: `https://github.com/metorial/skills/blob/main/metorial-events-and-monitoring/<path>`). The index of all Metorial skills is at https://skills.metorial.com/metorial-getting-started/SKILL.md.

Commands below are CLI. The MCP tool is the command path joined with underscores (`events listeners create` → `events_listeners_create`). All commands: [references/commands.md](https://skills.metorial.com/metorial-events-and-monitoring/references/commands.md).

## Send events to a webhook

```bash
metorial-admin events destinations create --name "Ops webhook" --type webhook \
  --webhook '{"url":"https://ops.example.com/metorial"}' \
  --retry '{"strategy":"exponential","max_attempts":8,"base_delay_seconds":10,"max_delay_seconds":3600}'
metorial-admin events destinations ping <destination-id>      # test delivery
```

Save the `signing_secret` from the create response somewhere secure (a secret manager or your app's env). It is shown only once. Don't print it back into the chat. `rotate-webhook-secret` issues a new one and invalidates the old.

Then add listeners for what you want delivered:

| Listen to | Command |
| --- | --- |
| Resource lifecycle events | `events listeners create --event-destination-id <id> --type event --event-types session.created,session.archived` |
| An integration callback's triggers | `events listeners create --event-destination-id <id> --type callback --callback-id <callback-id> --triggers issue.created` |
| All callbacks of a catalog provider | `--type callback --provider-id <provider-id>` (instead of `--callback-id`) |
| A chat connection's events | `--type chat --chat-connection-id <connection-id>` |

Listeners apply to the current instance (`--instance-id` to pick another). To find event type names, look at real events: `events list --source resource` and read `event_type`. Callbacks are set up in [metorial-integrations](https://skills.metorial.com/metorial-integrations/SKILL.md#callbacks), chat in [metorial-chat](https://skills.metorial.com/metorial-chat/SKILL.md).

## Verify webhooks

Each delivery is a `POST` with these headers: `metorial-event-id`, `metorial-event-type`, `metorial-delivery-id`, `metorial-delivery-attempt`, `metorial-destination-id`, `metorial-timestamp`, and `metorial-signature: t=<unix seconds>,v1=<hex>`.

`v1` is HMAC-SHA256 over `"<t>.<raw body>"` with the signing secret:

```typescript
import crypto from 'node:crypto';

export function verify(rawBody: string, header: string, secret: string, toleranceSeconds = 300) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) <= toleranceSeconds;
  return fresh && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 ?? ''));
}
```

Use the raw request body, not re-serialized JSON. Deduplicate with `metorial-event-id`, since retries resend the same event.

## Inspect events and deliveries

```bash
metorial-admin events list --source callback --callback-trigger-key issue.created
metorial-admin events get <event-id>
metorial-admin events deliveries list --event-destination-id <destination-id> --status failed
metorial-admin events delivery-attempts list --event-delivery-id <delivery-id>     # status code, response, timing per try
metorial-admin events deliveries retry <delivery-id>                                # after fixing the receiver
metorial-admin audit-logs list                       # who changed what, organization-wide
```

`events deliveries list` also filters by `--event-id`, `--event-type`, and `--instance-id`. `events list` filters: `--source` (`resource`, `callback`, `chat`, `ping`), `--event-type`, `--instance-id`, `--callback-id`, `--callback-trigger-key`, `--chat-connection-id`, `--provider-id`, `--created-at`. Per-area event logs live with their resources: session events ([metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md)), callback events, chat events, and sandbox machine events.

## Monitors and alerts

```bash
metorial-admin monitoring monitors list                       # target: protoguard_filter | schema_change
metorial-admin monitoring alerts list --status pending
metorial-admin monitoring alerts get <alert-id>               # session, message, provider run that triggered it
metorial-admin monitoring protoguard list --session-id <session-id>
metorial-admin monitoring alerts resolve <alert-id>           # or unresolve, viewed
```

- **ProtoGuard** scans tool traffic for prompt injection. An alert links to the session, message, connection, and provider run, so check those with [metorial-sessions](https://skills.metorial.com/metorial-sessions/SKILL.md) before resolving.
- **Schema change** alerts fire when a provider's tool specification changes. Review tool filters and agents that depend on the changed tools.

## Reference

- [references/commands.md](https://skills.metorial.com/metorial-events-and-monitoring/references/commands.md): generated CLI ↔ MCP table
