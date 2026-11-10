#!/usr/bin/env bun
/**
 * Generates `references/commands.md` for every Metorial skill from the two sources the
 * product itself is generated from:
 *
 *   - the admin CLI catalog  (metorial/cli: internal/generated/admin/catalog.go)
 *   - the admin MCP contract (metorial-admin integration: src/lib/contract.json)
 *
 * Both are produced by the same generator from the same manifest, so each CLI command maps to
 * one MCP tool. The tables also flag commands that exist in only one of the two.
 *
 * Usage:
 *   bun scripts/generate-references.ts [--catalog <path>] [--contract <path>]
 *
 * Defaults resolve to sibling checkouts, or set METORIAL_CLI_CATALOG / METORIAL_ADMIN_CONTRACT.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';

let repoRoot = path.resolve(import.meta.dir, '..');

let { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    catalog: { type: 'string' },
    contract: { type: 'string' }
  }
});

let catalogPath = path.resolve(
  values.catalog ||
    process.env.METORIAL_CLI_CATALOG ||
    path.join(repoRoot, '../metorial-enterprise/oss/cli/internal/generated/admin/catalog.go')
);
let contractPath = path.resolve(
  values.contract ||
    process.env.METORIAL_ADMIN_CONTRACT ||
    path.join(repoRoot, '../metorial/integrations/metorial-admin/src/lib/contract.json')
);

// Which skill documents which CLI command group / MCP category.
let skillForGroup: Record<string, string> = {
  instance: 'metorial-setup',
  'api-keys': 'metorial-setup',
  providers: 'metorial-providers',
  'custom-providers': 'metorial-custom-providers',
  integrations: 'metorial-integrations',
  callbacks: 'metorial-integrations',
  'magic-mcp': 'metorial-magic-mcp',
  sessions: 'metorial-sessions',
  identity: 'metorial-identities',
  portals: 'metorial-portals',
  consumers: 'metorial-portals',
  skills: 'metorial-skills',
  sandbox: 'metorial-sandboxes',
  files: 'metorial-files-and-stores',
  stores: 'metorial-files-and-stores',
  documents: 'metorial-files-and-stores',
  chat: 'metorial-chat',
  events: 'metorial-events-and-monitoring',
  monitoring: 'metorial-events-and-monitoring',
  'audit-logs': 'metorial-events-and-monitoring',
  network: 'metorial-network',
  outposts: 'metorial-network'
};

// Commands and tools written by hand rather than generated from the API.
type Extra = {
  group: string;
  cli?: string;
  tool?: string;
  effect: Effect;
  summary: string;
  inputs?: string;
};

let extras: Extra[] = [
  {
    group: 'instance',
    tool: 'get_account_context',
    effect: 'read',
    summary:
      'Show the credential type and its organization, project, instance, actor, and user. CLI: whoami is not available; use instance list and cli profile get.'
  },
  {
    group: 'instance',
    cli: 'fetch <path-or-url> [-X <method>] [-d <json>]',
    tool: 'call_endpoint',
    effect: 'destructive',
    summary:
      'Send a raw authenticated API request. Use only when no dedicated command or tool exists.',
    inputs: 'MCP: method, endpointPath, instanceId'
  },
  {
    group: 'instance',
    cli: 'cli search <query>',
    tool: 'list_endpoints',
    effect: 'read',
    summary: 'Find commands (CLI) or API endpoints (MCP) by keyword.'
  },
  {
    group: 'files',
    cli: 'files upload <path> [--purpose <purpose>]',
    tool: 'files_upload',
    effect: 'write',
    summary:
      'Upload a file. The CLI reads from disk and zips directories; the MCP tool takes base64 content up to 5 MB.',
    inputs: 'CLI: <path> · MCP: fileBase64, filename'
  },
  {
    group: 'sandbox',
    cli: 'sandbox machines shell <machine-id> [-- <command>]',
    effect: 'destructive',
    summary:
      'Open an interactive shell, or run one command with exit code passthrough. MCP: use sandbox_machines_exec.'
  },
  {
    group: 'sandbox',
    cli: 'sandbox machines files ls|stat|cat|download|upload|mkdir|mv|rm <machine-id> <path>',
    effect: 'write',
    summary:
      'Browse and transfer files on a running machine. MCP: use sandbox_machines_exec or sandbox_machines_access_files.'
  },
  {
    group: 'skills',
    cli: 'skills pull <skill> [dir]',
    effect: 'read',
    summary: 'Download a skill into a local folder and record file versions in .metorial/skill.json.'
  },
  {
    group: 'skills',
    cli: 'skills push [dir] [--dry-run] [--force]',
    effect: 'write',
    summary: 'Upload local changes with per-file version preconditions. MCP: use skills_files_batch.'
  },
  {
    group: 'skills',
    cli: 'skills status [dir]',
    effect: 'read',
    summary: 'Show local and remote changes since the last pull or push.'
  }
];

type Effect = 'read' | 'write' | 'destructive';

type CliOperation = {
  group: string;
  path: string[];
  name: string;
  method: string;
  apiPath: string;
  short: string;
  args: string[];
  requiredFlags: string[];
};

type ContractTool = {
  key: string;
  name: string;
  description: string;
  category: string;
  method: string;
  path: string;
  readOnly: boolean;
  destructive: boolean;
  inputSchema: { required?: string[] };
};

let unquote = (value: string) => JSON.parse(value) as string;

let parseCatalog = (source: string): CliOperation[] => {
  let operations: CliOperation[] = [];
  let stack: { indent: number; name: string }[] = [];
  let current: CliOperation | null = null;

  let flush = () => {
    if (current) operations.push(current);
    current = null;
  };

  for (let line of source.split('\n')) {
    let indent = line.length - line.replace(/^\t+/, '').length;

    let plural = line.match(/^\t+Plural:\s+(".*")/);
    if (plural) {
      flush();
      while (stack.length && stack[stack.length - 1]!.indent >= indent) stack.pop();
      stack.push({ indent, name: unquote(plural[1]!) });
      continue;
    }

    let name = line.match(/^\t+Name:\s+(".*")/);
    if (name) {
      flush();
      let owners = stack.filter(entry => entry.indent < indent);
      let resourcePath = owners.map(entry => entry.name);
      current = {
        group: resourcePath[0]!,
        path: resourcePath,
        name: unquote(name[1]!),
        method: '',
        apiPath: '',
        short: '',
        args: [],
        requiredFlags: []
      };
      continue;
    }

    if (!current) continue;
    let op = current as CliOperation;

    let field = line.match(/^\t+(Method|Path|Short|Use):\s+(".*")/);
    if (field) {
      let value = unquote(field[2]!);
      if (field[1] === 'Method') op.method = value;
      if (field[1] === 'Path') op.apiPath = value;
      if (field[1] === 'Short') op.short = value;
      continue;
    }

    let arg = line.match(/^\t+\{Name: "([^"]+)", Target: "path\.[^"]+", Required: (true|false)/);
    if (arg) {
      op.args.push(arg[2] === 'true' ? `<${arg[1]}>` : `[${arg[1]}]`);
      continue;
    }

    let flag = line.match(/^\t+\{Name: "([^"]+)", Type: [^,]+, Target: "[^"]+", Usage: ".*?", Required: true/);
    if (flag) op.requiredFlags.push(`--${flag[1]}`);
  }

  flush();
  return operations.filter(operation => operation.method && operation.apiPath);
};

let snake = (value: string) => value.replace(/-/g, '_');

let effectOf = (tool: ContractTool | undefined, method: string): Effect => {
  if (tool) return tool.destructive ? 'destructive' : tool.readOnly ? 'read' : 'write';
  if (method === 'GET') return 'read';
  if (method === 'DELETE') return 'destructive';
  return 'write';
};

let escapeCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ');

let main = async () => {
  let catalog = parseCatalog(await Bun.file(catalogPath).text());
  let contract = (await Bun.file(contractPath).json()) as {
    generatedFrom: { apiVersion: string };
    categories: { key: string; name: string; description: string }[];
    tools: ContractTool[];
  };

  let toolsByKey = new Map(contract.tools.map(tool => [tool.key, tool]));
  let toolsByRoute = new Map(contract.tools.map(tool => [`${tool.method} ${tool.path}`, tool]));
  let matchedTools = new Set<string>();

  type Row = {
    resource: string;
    cli?: string;
    tool?: string;
    effect: Effect;
    summary: string;
    inputs: string;
    api?: string;
  };

  let rowsBySkill = new Map<string, Row[]>();
  let addRow = (group: string, row: Row) => {
    let skill = skillForGroup[group];
    if (!skill) throw new Error(`No skill mapped for command group "${group}"`);
    let rows = rowsBySkill.get(skill) || [];
    rows.push(row);
    rowsBySkill.set(skill, rows);
  };

  for (let operation of catalog) {
    let key = [...operation.path, operation.name].map(snake).join('_');
    let tool = toolsByKey.get(key) || toolsByRoute.get(`${operation.method} ${operation.apiPath}`);
    if (tool) matchedTools.add(tool.key);

    let inputs = [...operation.args, ...operation.requiredFlags];

    addRow(operation.group, {
      resource: operation.path.join(' '),
      cli: [operation.path.join(' '), operation.name, ...operation.args].join(' '),
      tool: tool?.key,
      effect: effectOf(tool, operation.method),
      summary: operation.short || tool?.name || '',
      inputs: inputs.length ? inputs.join(' ') : '',
      api: `${operation.method} ${operation.apiPath}`
    });
  }

  for (let tool of contract.tools) {
    if (matchedTools.has(tool.key)) continue;
    addRow(tool.category, {
      resource: tool.category,
      tool: tool.key,
      effect: effectOf(tool, tool.method),
      summary: tool.name,
      inputs: (tool.inputSchema.required || []).join(', '),
      api: `${tool.method} ${tool.path}`
    });
  }

  for (let extra of extras) {
    addRow(extra.group, {
      resource: `${extra.group} (hand-written)`,
      cli: extra.cli,
      tool: extra.tool,
      effect: extra.effect,
      summary: extra.summary,
      inputs: extra.inputs || ''
    });
  }

  let written: string[] = [];

  for (let [skill, rows] of rowsBySkill) {
    let groups = new Map<string, Row[]>();
    for (let row of rows) {
      let list = groups.get(row.resource) || [];
      list.push(row);
      groups.set(row.resource, list);
    }

    let cliCount = rows.filter(row => row.cli).length;
    let toolCount = rows.filter(row => row.tool).length;

    let lines: string[] = [
      '<!-- Generated by scripts/generate-references.ts. Do not edit by hand. -->',
      '',
      '# Command reference',
      '',
      `Every operation in this area, as a \`metorial-admin\` CLI command and as a tool on the Metorial admin MCP server (\`mcp.metorial.com/mcp\`). API version: \`${contract.generatedFrom.apiVersion}\`. ${cliCount} CLI commands, ${toolCount} MCP tools.`,
      '',
      '- **CLI**: prefix with `metorial-admin`. Run `metorial-admin <command> --help` for every flag. Write commands also accept `--body` or `--body-file` with a JSON object.',
      '- **MCP tool**: pass inputs in snake_case (`<provider-id>` → `provider_id`). Instance-scoped tools also accept an optional `instance_id`.',
      '- **Effect**: `read` changes nothing; `write` creates or changes something; `destructive` deletes, revokes, archives, or runs code. Confirm destructive actions with the user first.',
      '- **—** in a column means that interface has no equivalent. Use the alternative named in the summary, or call the API path with `metorial-admin fetch` / the `call_endpoint` tool.',
      ''
    ];

    for (let [resource, groupRows] of groups) {
      lines.push(`## ${resource}`, '');
      lines.push('| CLI command | MCP tool | Effect | Summary | Required inputs | API |');
      lines.push('| --- | --- | --- | --- | --- | --- |');
      for (let row of groupRows) {
        lines.push(
          `| ${row.cli ? `\`${escapeCell(row.cli)}\`` : '—'} | ${row.tool ? `\`${row.tool}\`` : '—'} | ${row.effect} | ${escapeCell(row.summary)} | ${row.inputs ? escapeCell(row.inputs) : ''} | ${row.api ? `\`${row.api}\`` : ''} |`
        );
      }
      lines.push('');
    }

    let outPath = path.join(repoRoot, skill, 'references', 'commands.md');
    await Bun.write(outPath, lines.join('\n'));
    written.push(`${path.relative(repoRoot, outPath)} (${cliCount} CLI, ${toolCount} MCP)`);
  }

  console.log(`Catalog:  ${catalogPath}\nContract: ${contractPath}\n`);
  console.log(written.sort().join('\n'));
};

await main();
