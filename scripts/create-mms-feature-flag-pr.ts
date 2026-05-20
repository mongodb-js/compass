#!/usr/bin/env ts-node
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

interface FlagInfo {
  name: string;
  scope: string;
  description: string;
}

const PHASES = [
  'local: enabled',
  'local-gov: controlled',
  'test: controlled',
  'test-gov: controlled',
  'dev: controlled',
  'dev-gov: controlled',
  'qa: controlled',
  'qa-gov: controlled',
  'stage: controlled',
  'prod: controlled',
  'prod-gov: controlled',
  'internal: controlled',
] as const;

function assertNewFlagsAreValid(flags: unknown[]): asserts flags is FlagInfo[] {
  for (const flag of flags) {
    if (typeof flag !== 'object' || flag === null) {
      throw new Error(
        `Expected flag definition to be an object, got ${typeof flag}`
      );
    }

    if (!('name' in flag) || typeof flag.name !== 'string') {
      throw new Error('Expected flag to have a string name property');
    }
    if (
      !('scope' in flag) ||
      typeof flag.scope !== 'string' ||
      !['group', 'organization'].includes(flag.scope)
    ) {
      throw new Error(
        'Expected flag to have a string scope property with value "group" or "organization"'
      );
    }
    if (!('description' in flag) || typeof flag.description !== 'string') {
      throw new Error('Expected flag to have a string description property');
    }
  }
}

function toKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, (_, c: string) => `-${c.toLowerCase()}`)
    .replace(/^-/, '');
}

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (r.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

function runCapture(
  cmd: string,
  args: string[]
): { status: number | null; stdout: string; stderr: string } {
  return spawnSync(cmd, args, { encoding: 'utf8' });
}

function main(): void {
  const flags: unknown[] = JSON.parse(process.env.NEW_FLAGS ?? '[]');
  assertNewFlagsAreValid(flags);
  const prTitle = process.env.PR_TITLE ?? '';
  const sourcePr = process.env.SOURCE_PR ?? '';
  const sourceRepo = process.env.SOURCE_REPO ?? '';

  const jirTicket = prTitle.match(/([A-Z]+-\d+)/)?.[1] ?? null;

  for (const flag of flags) {
    const { name, description, scope } = flag;
    const kebab = toKebab(name);
    const branch = `feature-flag-compass-web-${kebab}-pr${sourcePr}`;
    const filepath = `feature-flags/definitions/developer-tools/data-explorer-compass-web-${kebab}.yml`;
    const mmsPrTitle = jirTicket
      ? `${jirTicket}: Add feature flag ${name}`
      : `Add feature flag ${name}`;

    // Error if the file already exists in master
    const check = runCapture('git', ['show', `origin/master:${filepath}`]);
    if (check.status === 0) {
      console.error(
        `Error: ${filepath} already exists in master. Remove it first or skip this flag.`
      );
      process.exit(1);
    }

    const phasesYaml = PHASES.map((p) => `  ${p}`).join('\n');
    const fileContent = [
      `name: mms.featureFlag.dataExplorerCompassWeb.${name}`,
      `namespace: global`,
      `scope: ${scope}`,
      `description: ${description}`,
      `phases: `,
      phasesYaml,
      '',
    ].join('\n');

    run('git', ['checkout', 'master']);
    run('git', ['checkout', '-b', branch]);

    mkdirSync('feature-flags/definitions/developer-tools', { recursive: true });
    writeFileSync(filepath, fileContent);

    run('git', ['add', filepath]);
    run('git', ['commit', '-m', mmsPrTitle]);
    run('git', ['push', 'origin', branch]);

    const scopeLine = scope
      ? `**Scope:** \`${scope}\``
      : '**Scope:** ⚠️ Not specified in source definition — update if required.';

    const prBody = [
      `Adds MMS feature flag definition for \`${name}\`,`,
      `introduced in ${sourceRepo}#${sourcePr}.`,
      '',
      `**Flag name:** \`${name}\``,
      `**Description:** ${description}`,
      scopeLine,
    ].join('\n');

    const prResult = runCapture('gh', [
      'pr',
      'create',
      '--repo',
      '10gen/mms',
      '--title',
      mmsPrTitle,
      '--body',
      prBody,
      '--base',
      'master',
      '--head',
      branch,
    ]);

    if (prResult.status !== 0) {
      console.error(`Failed to create PR for ${name}:\n${prResult.stderr}`);
      process.exit(1);
    }

    console.log(`Created MMS PR for ${name}: ${prResult.stdout.trim()}`);
  }
}

main();
