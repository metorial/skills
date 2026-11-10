# Consumer CLI (`metorial`)

`metorial` is the CLI for **portal consumers**: employees or customers who use the tools a portal offers. It is not `metorial-admin`. It signs in as a consumer, shows only what that consumer's groups may access, and connects integrations for that consumer.

Use it when you're acting as an end user (an agent on someone's laptop, a developer wiring tools into their own MCP client). To configure portals, use `metorial-admin` ([metorial-portals](https://skills.metorial.com/metorial-portals/SKILL.md)).

## Install and sign in

```bash
npm install -g @metorial/cli          # or: brew install metorial/tap/metorial · npx @metorial/cli@latest
metorial login                        # browser OAuth; pick the portal; saves a profile in ~/.metorial/cli/config.json
metorial whoami                       # consumer, portal, and consumer groups
```

Only people with a consumer profile on an active portal can sign in. Profiles: `metorial profile …`. Settings: `metorial settings …`. Sign out: `metorial logout`.

## Find and connect integrations

```bash
metorial catalog list                         # what the portal offers you
metorial search "github"                      # or: metorial catalog search
metorial catalog get <catalog-item-id>        # auth methods and tools
metorial setup <catalog-item-id> --name "Work GitHub"
metorial request-access <catalog-item-id> --message "Need this for release notes"
```

`setup` opens the portal's setup page, waits for the consumer to finish OAuth or the form, and then creates the integration (the consumer's own instance and Magic MCP server behind the scenes). `--auth-method <id>` picks a non-default auth method. `request-access` asks portal admins for an item the consumer's groups don't include yet.

## Use integrations

```bash
metorial list [search]                        # your integrations
metorial get <integration-id>
metorial tools <integration-id>               # providers and tool keys
metorial schema <integration-id> <tool-key>   # input schema
metorial call <integration-id> <tool-key> -d '{"query":"is:open"}'
echo '{"query":"is:open"}' | metorial call <integration-id> <tool-key> -d @-
```

Maintain them:

```bash
metorial update <integration-id> --name "Personal GitHub"
metorial reconnect <catalog-item-id> <integration-id>   # re-auth, keeps the endpoint URL
metorial remove <integration-id>                        # confirm with the user first
```

## Install into a local MCP client

```bash
metorial client list                          # supported clients, whether installed and usable
metorial install claude-code <integration-id> # writes the client config with a long-lived MCP token
metorial install custom <integration-id>      # creates a token and prints the URL and header for any client
metorial tokens list
metorial tokens revoke <token-id>
```

Client identifiers come from `metorial client list` (for example `claude-code`, `claude`, `cursor`, `codex`). Each install creates its own token. Revoke the ones that are no longer used.

## Skills

Consumers can work with the skills their portal gives them, if the portal allows skill authoring:

```bash
metorial skills list
metorial skills pull <skill> ./<skill>
metorial skills status ./<skill>
metorial skills push ./<skill>
metorial skills files ls|cat|put|rm <skill> <path>
```

The folder sync works as described in [metorial-skills local sync](https://skills.metorial.com/metorial-skills/references/local-sync.md).
