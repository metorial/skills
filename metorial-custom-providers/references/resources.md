# Custom provider resources

```
Custom provider (type: container | function | remote, status: active | archived)
├─ Version            one source snapshot (`from`, optional `config`), identifier + index
│  └─ Deployment      build + discovery job for that version → logs
├─ Environment        the custom provider in one instance; points at its current version
└─ Commit             promotion or rollback between environments
        │
        ▼ on success
Provider + provider version  (normal provider: deploy it, use it anywhere)
```

## Custom provider

| Field | Meaning |
| --- | --- |
| `type` | `container`, `function`, `remote`. Fixed at creation. |
| `status` | `active`, `archived`, `deleted` |
| `provider_id` | The provider it produces. `null` until the first successful build. |
| `name`, `description`, `readme`, `metadata` | Editable with `update` |

`archive` disables new connections. There is no hard delete.

## Version

A source snapshot. Created by `custom-providers create` (the first one) and `custom-providers versions create`.

| Field | Meaning |
| --- | --- |
| `status` | `queued`, `deploying`, `deployment_succeeded`, `deployment_failed` |
| `identifier`, `index` | Human version label and sequence number |
| `config` | `{ schema: <JSON schema>, transformer }` when the provider accepts configuration |
| `deployment` | The build job for this version |
| `environments[]` | Environments the version is in, with `is_current_version_for_environment` |
| `provider_id` | The resulting provider |

## Deployment (build job)

Not a provider deployment. It builds the version and discovers its tools.

- `status`: `queued`, `deploying`, `succeeded`, `failed`
- trigger: `manual`, `system`, or `scm` (a push to a connected repository)
- `get-logs`: build and discovery output. Read it first when a build fails.

To run the result, create a **provider deployment** ([metorial-providers](https://skills.metorial.com/metorial-providers/SKILL.md)).

## Environment

The custom provider within one instance: `instance_id` and `current_provider_version_id`. A version created in an instance becomes that instance's current version when its build succeeds. Other instances change only through commits.

## Commit

| Action | Fields | Effect |
| --- | --- | --- |
| `merge_version_into_environment` | `from_environment_id`, `to_environment_id` | Copies the source environment's current version to the target. No rebuild. |
| `rollback_commit` | `environment_id`, `version_id` | Points the environment back at an earlier version. No rebuild. |

Every commit has a `message`. The commit list is the audit trail of releases.

## Relation to everything else

Once built, a custom provider is indistinguishable from a catalog provider downstream. Integrations, sessions, Magic MCP servers, portals, tool filters, and monitoring all treat it the same. Provider deployments that follow the latest version get each new build automatically. Pin `locked_provider_version_id` for change control.
