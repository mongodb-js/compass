#!/usr/bin/env node
import ts from 'typescript';
import { spawnSync } from 'child_process';
import { appendFileSync } from 'fs';

const FILEPATH = 'packages/compass-preferences-model/src/feature-flags.ts';

interface FlagInfo {
  name: string;
  scope: string;
  description: string;
}

function getFileAt(sha: string): string | null {
  const r = spawnSync('git', ['show', `${sha}:${FILEPATH}`], {
    encoding: 'utf8',
  });
  return r.status === 0 ? r.stdout : null;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function getFeatureFlagConfigForMMS(flag: FlagInfo): {
  filePath: string;
  fileName: string;
  config: string;
} {
  const fileName = `data-explorer-compass-web-${toKebabCase(flag.name)}.yml`;
  const config = `# This feature flag config was added from Compass, https://github.com/mongodb-js/compass. If the
# usage of this does not appear within mms codebase, it should not be removed before verifying if its
# being used in Compass. \`/explorer/v1/groups/:id/preferences\` API exposes this feature flag value
# to Compass dynamically, without being added to \`FeatureFlag.java\` enum. You can also reach out to
# the compass team on #compass slack channel for more information.
name: mms.featureFlag.dataExplorerCompassWeb.${flag.name}
namespace: global
scope: ${JSON.stringify(flag.scope)}
description: ${JSON.stringify(flag.description)}
phases:
  local: enabled
  local-gov: disabled
  test: controlled
  test-gov: disabled
  dev: controlled
  dev-gov: disabled
  qa: controlled
  qa-gov: disabled
  stage: controlled
  prod: controlled
  prod-gov: disabled
  internal: disabled
`;
  return {
    filePath: `feature-flags/definitions/developer-tools/${fileName}`,
    fileName,
    config,
  };
}

function getStringProp(
  obj: ts.ObjectLiteralExpression,
  key: string
): string | null {
  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === key &&
      ts.isStringLiteral(prop.initializer)
    ) {
      return prop.initializer.text;
    }
  }
  return null;
}

function getObjectProp(
  obj: ts.ObjectLiteralExpression,
  key: string
): ts.ObjectLiteralExpression | null {
  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === key &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      return prop.initializer;
    }
  }
  return null;
}

function extractFlags(source: string): Map<string, FlagInfo> {
  const sourceFile = ts.createSourceFile(
    'feature-flags.ts',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );
  const flags = new Map<string, FlagInfo>();

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'FEATURE_FLAG_DEFINITIONS' &&
      node.initializer
    ) {
      // Unwrap "as const satisfies ..." to reach the ArrayLiteralExpression.
      let expr: ts.Expression = node.initializer;
      while (ts.isSatisfiesExpression(expr) || ts.isAsExpression(expr)) {
        expr = expr.expression;
      }

      if (ts.isArrayLiteralExpression(expr)) {
        for (const element of expr.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const name = getStringProp(element, 'name');
          if (!name) continue;
          const descObj = getObjectProp(element, 'description');
          const scope = getStringProp(element, 'atlasCloudFeatureScope');
          if (!scope) {
            // Only extract new feature flags to be used in Atlas.
            continue;
          }
          flags.set(name, {
            name,
            scope,
            description: descObj ? getStringProp(descObj, 'short') ?? '' : '',
          });
        }
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return flags;
}

function resolveRef(ref: string): string | null {
  const r = spawnSync('git', ['rev-parse', ref], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function withCodeFence(code: string): string {
  return ['', '```yml', code, '```'].join('\n');
}

function buildCommentBody(flags: FlagInfo[]): string {
  const flagSummaries = flags
    .map(
      (flag) => `### \`${flag.name}\`
- **Description:** ${
        flag.description ||
        '_Not set._ Please add a description object with at least a short property to the feature flag definition in `feature-flags.ts` so it can be used in the MMS feature flag definition.'
      }
- **Atlas Cloud Scope:** \`${flag.scope}\``
    )
    .join('\n\n');

  const flagDefinitions = flags
    .map(getFeatureFlagConfigForMMS)
    .map((c) => {
      return `\`${c.fileName}\`\n${withCodeFence(c.config)}`;
    })
    .join('\n---\n');

  return `## New Feature Flag${
    flags.length === 1 ? '' : 's'
  } Definition Detected

The following new feature flag${
    flags.length === 1 ? ' was' : 's were'
  } added to \`FEATURE_FLAG_DEFINITIONS\` in \`feature-flags.ts\`:

${flagSummaries}

---

**Once this PR is merged, mms PR will be created automatically. It will add ${
    flags.length
  } new feature flag config${
    flags.length === 1 ? '' : 's'
  } to MMS and will be assigned to the author of this PR. If that fails for some reason, follow the steps listed below instead**
<details><summary>Steps to create MMS feature flag manually</summary>

For each feature flag, create a new file in the [feature-flags/definitions/developer-tools](https://github.com/10gen/mms/tree/master/feature-flags/definitions/developer-tools) directory with contents corresponding to that feature flag definition.

---

${flagDefinitions}
</details>
`;
}

function main(): void {
  const { BASE_SHA, HEAD_SHA, GITHUB_OUTPUT: githubOutput = '' } = process.env;

  // Fall back to local refs when running outside CI.
  const headSha = HEAD_SHA ?? resolveRef('HEAD');
  const baseSha = BASE_SHA ?? resolveRef('origin/main') ?? resolveRef('main');

  if (!headSha) {
    console.error('Could not resolve HEAD SHA');
    process.exit(1);
  }
  if (!baseSha) {
    console.error(
      'Could not resolve base SHA (set BASE_SHA or ensure origin/main exists)'
    );
    process.exit(1);
  }

  const mergeBaseResult = spawnSync('git', ['merge-base', baseSha, headSha], {
    encoding: 'utf8',
  });
  const mergeBase =
    mergeBaseResult.status === 0 ? mergeBaseResult.stdout.trim() : baseSha;

  const headSource = getFileAt(headSha);
  if (!headSource) {
    console.error(`Could not read ${FILEPATH} at ${headSha}`);
    process.exit(1);
  }

  // List of feature flags where we added `atlasCloudFeatureScope` to the definition
  // after the automation (to create mms PRs). We do not want to create mms PRs for
  // these as they already exist in mms codebase. When cleaning up any of these flags,
  // remove them from this list as well.
  const ignoreList = new Set([
    'enableRestoreWorkspaces',
    'enableAutoEmbeddingPublicPreview',
    'enableAutoEmbeddingPrivatePreview',
    'enableSortedSearchIndexes',
  ]);

  const baseSource = getFileAt(mergeBase);
  const baseFlags = baseSource ? extractFlags(baseSource) : new Map();

  const headFlags = extractFlags(headSource);
  const newFlags = [...headFlags.values()].filter(
    (f) => !baseFlags.has(f.name) && !ignoreList.has(f.name)
  );

  console.log(
    newFlags.length
      ? `New feature flags detected: ${newFlags.map((f) => f.name).join(', ')}`
      : 'No new feature flags detected.'
  );

  if (githubOutput) {
    appendFileSync(githubOutput, `flags_count=${newFlags.length}\n`);
    if (newFlags.length > 0) {
      const delimiter = `ghadelimiter_${Math.random().toString(36).slice(2)}`;
      const body = buildCommentBody(newFlags);
      appendFileSync(
        githubOutput,
        `comment_body<<${delimiter}\n${body}\n${delimiter}\n`
      );
      const mmsPullRequestContent = newFlags.map(getFeatureFlagConfigForMMS);
      appendFileSync(
        githubOutput,
        `mms_pull_request_content<<${delimiter}\n${JSON.stringify(
          mmsPullRequestContent
        )}\n${delimiter}\n`
      );
    }
  } else {
    console.log(newFlags);
  }
}

main();
