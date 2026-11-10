# Admin CLI reference

Install, authenticate, and configure `metorial-admin`, the CLI for administering a Metorial organization.

Metorial ships two CLIs. This skill set covers `metorial-admin`. The other one, `metorial`, is the consumer CLI for portal users: see [metorial-portals/references/consumer-cli.md](https://skills.metorial.com/metorial-portals/references/consumer-cli.md).

## Install

```bash
npm install -g @metorial/admin                      # npm
npx @metorial/admin@latest <command>                # no install
brew install metorial/tap/metorial-admin            # Homebrew
curl -fsSL https://cli.metorial.com/install.sh | bash   # installs metorial and metorial-admin
```

Windows: `scoop bucket add metorial https://github.com/metorial/scoop-bucket`, then `scoop install metorial-admin`.

Upgrade with `metorial-admin upgrade`. Set `METORIAL_SKIP_UPDATE_CHECK=1` to silence update notices in automation.

## Authenticate

The CLI picks credentials in this order:

1. `--api-key <key>` flag
2. `METORIAL_API_KEY`, then `METORIAL_TOKEN`
3. `--profile <id>`, or the current saved profile

### Sign in (interactive)

```bash
metorial-admin login     # browser OAuth; the new profile becomes current
metorial-admin logout    # removes the current profile from this machine
```

Profiles live in `~/.metorial/cli/config.json`. Logging in again for the same organization and user updates the existing profile.

### Create an organization without an account

```bash
metorial-admin signup --region eu1     # or us1
metorial-admin claim user@example.com  # emails the claim link, with daily reminders
metorial-admin claim                   # prints and opens the claim link instead
```

`signup` creates an organization named `<user>'s workspace` with a project and an instance, then saves a profile. The organization works immediately. It stays **unclaimed** until a person opens the claim link and signs in. The claim token exists only on the machine that ran `signup`.

Without `--region`, agents get an error listing the available regions and a recommendation. Pick the recommended region unless the user asked for a specific one (data residency), then rerun with `--region`.

After `signup`, ask the user which email to use before running `claim <email>`. If the CLI prints a likely address, confirm it with the user; never assume it.

### API keys (automation)

| Prefix | Scope | Instance selection |
| --- | --- | --- |
| `metorial_sk_` | One instance, secret | Not needed |
| `metorial_pk_` | One instance, publishable | Not needed |
| Organization management tokens, and OAuth tokens from `login` (`metorial_oa_`) | Organization | Required when more than one instance exists |

Create and rotate keys with `metorial-admin api-keys create|rotate|reveal|revoke`. The secret appears only once, at creation. These commands are CLI-only because they return secrets.

## Profiles and settings

```bash
metorial-admin cli profile list              # saved profiles; marks the current one
metorial-admin cli profile set <name-or-id>  # switch
metorial-admin cli profile add               # add another org via OAuth
metorial-admin cli settings list
metorial-admin cli settings set default-format json      # or yaml, toml, structured
metorial-admin cli settings set default-api-host <host>  # self-hosted or regional API
```

## Select an instance

For organization-level credentials the CLI resolves the instance in this order:

1. `--instance <id>`
2. `METORIAL_INSTANCE_ID`
3. The choice saved for this directory in `./.metorial/config.json`
4. The only instance, if exactly one exists
5. An interactive prompt in a terminal, which saves to step 3; otherwise an error

```bash
metorial-admin instance list
metorial-admin instance get <instance-id>
metorial-admin --instance inst_123 sessions list
```

Instances and projects are created in the dashboard (`metorial-admin open`). The CLI and MCP server can list and read them.

## Global flags

| Flag | Purpose |
| --- | --- |
| `--format json\|yaml\|toml\|structured` | Output format. Use `json` when parsing. |
| `--instance <id>` | Instance for organization-level tokens |
| `--profile <id>` | Use a saved profile other than the current one |
| `--api-key <key>` | One-off credential |
| `--api-host <host>` | API host (default `api.metorial.com`). Env: `METORIAL_API_HOST` |

## Discover commands

```bash
metorial-admin --format json cli search "<resource> <action>"   # every word must match
metorial-admin <group> --help
metorial-admin <group> <resource> <action> --help                # arguments, flags, examples
```

If a search returns nothing, use fewer words.

## Other commands

| Command | Purpose |
| --- | --- |
| `metorial-admin fetch <path>` | Raw authenticated API request. See [conventions.md](https://skills.metorial.com/metorial-setup/references/conventions.md#raw-api-calls). |
| `metorial-admin example list` / `example create <identifier> [path]` | Clone an official starter project (`npm create metorial@latest` does the same) |
| `metorial-admin open` | Open the dashboard in the browser |
| `metorial-admin feedback` | Report an issue |
| `metorial-admin completion <shell>` | Shell completions |
