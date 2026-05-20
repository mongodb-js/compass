#!/usr/bin/env ts-node
import ts from 'typescript';
import { spawnSync } from 'child_process';
import { appendFileSync } from 'fs';

const FILEPATH = 'packages/compass-preferences-model/src/feature-flags.ts';

interface FlagInfo {
  name: string;
  scope: string | null;
  description: string | null;
}

function getFileAt(sha: string): string | null {
  const r = spawnSync('git', ['show', `${sha}:${FILEPATH}`], {
    encoding: 'utf8',
  });
  return r.status === 0 ? r.stdout : null;
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
      // Unwrap "as const satisfies ..." to reach the ArrayLiteralExpression
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
          flags.set(name, {
            name,
            scope: getStringProp(element, 'atlasCloudFeatureScope'),
            description: descObj ? getStringProp(descObj, 'short') : null,
          });
        }
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

function main(): void {
  const { BASE_SHA, HEAD_SHA, GITHUB_OUTPUT: githubOutput = '' } = process.env;

  // Fall back to local refs when running outside CI
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

  const baseSource = getFileAt(mergeBase);
  const baseFlags = baseSource ? extractFlags(baseSource) : new Map();

  const headFlags = extractFlags(headSource);
  const newFlags = [...headFlags.values()].filter(
    (f) => !baseFlags.has(f.name)
  );

  console.log(
    newFlags.length
      ? `New feature flags detected: ${newFlags.map((f) => f.name).join(', ')}`
      : 'No new feature flags detected.'
  );

  if (githubOutput) {
    appendFileSync(githubOutput, `new_flags=${JSON.stringify(newFlags)}\n`);
    appendFileSync(githubOutput, `flags_count=${newFlags.length}\n`);
  } else {
    console.log(newFlags);
  }
}

main();
