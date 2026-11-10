# Organization, project, instance

Metorial organizes everything in three levels.

```
Organization        company or team; members, roles, billing
└─ Project          one application or product; separate access per project
   ├─ Instance      production (one per project, created automatically)
   └─ Instance      sandbox environments (staging, dev…); create as many as needed
```

## Organization

The top-level workspace. Holds members, teams, roles and policies, billing, and every project.

Organization-level resources (no `instance_id` needed):

| Resource | Skill |
| --- | --- |
| API keys | [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md) |
| Event destinations, listeners, events | [metorial-events-and-monitoring](https://skills.metorial.com/metorial-events-and-monitoring/SKILL.md) |
| Outposts (private network connectors) | [metorial-network](https://skills.metorial.com/metorial-network/SKILL.md) |

Members, teams, roles, and policies are managed in the dashboard.

## Project

Groups the instances of one application. Create separate projects when ownership or access should be separate. Projects are created in the dashboard.

## Instance

An isolated environment. Every project has one production instance and any number of sandbox instances. Each instance has its own:

- provider deployments, configs, auth configs, and credentials
- custom providers, integrations, and integration instances
- sessions, session templates, and all their logs
- Magic MCP servers, endpoints, groups, and tokens
- identities, actors, consumers, and portals
- skills, files, documents, and stores
- sandbox machines, images, and disks
- chat connections, callbacks, monitors, and network rules
- instance API keys (`metorial_sk_…`, `metorial_pk_…`)

Nothing is shared across instances. To promote a setup from staging to production, recreate it in the production instance. Custom providers are the exception: each instance is an *environment* of the custom provider, and commits promote a built version from one instance to another (see [metorial-custom-providers](https://skills.metorial.com/metorial-custom-providers/SKILL.md)).

Instances have an ID and a slug. Both work wherever an instance is expected.

## Selecting an instance

| Credential | Instance |
| --- | --- |
| Instance API key (`metorial_sk_`, `metorial_pk_`) | Fixed by the key |
| OAuth (CLI profile, admin MCP connection), organization management token | Choose per call: `--instance` / `METORIAL_INSTANCE_ID` / `instance_id` |

Details: [metorial-setup](https://skills.metorial.com/metorial-setup/SKILL.md#select-an-instance).

## Creating organizations, projects, instances

| Action | How |
| --- | --- |
| New organization (with first project and instance) | `metorial-admin signup --region <id>`, or sign up on the website |
| Join an existing organization | Be invited, then `metorial-admin login` |
| New project or instance | Dashboard (`metorial-admin open`) |
| List and read instances | `metorial-admin instance list\|get`, MCP `instance_list` / `instance_get` |

## Regions

An organization's data lives in one region (for example `eu1`, `us1`), chosen at signup. The API host routes requests automatically.
