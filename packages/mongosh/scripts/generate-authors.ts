#!/usr/bin/env ts-node

/*
 * Generate an AUTHOR file on the repo root and on each lerna package based on git log.
 *
 * Add / change aliases in .mailmap to avoid duplications and show the correct
 * names / emails.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const packageRootPath = path.resolve(__dirname, '..');

function getAuthorsGitLog(packagePath: string): string[] {
  return execSync(
    `git log --reverse --format='%aN <%aE>' --use-mailmap -- ${packagePath}`,
    { cwd: packageRootPath }
  ).toString().trim().split('\n');
}

function getAuthorsOrderedByFirstCommit(packagePath: string): string[] {
  const alreadyAdded = new Set();
  const authors = [];

  for (const authorName of getAuthorsGitLog(packagePath)) {
    if (alreadyAdded.has(authorName)) { continue; }
    alreadyAdded.add(authorName);
    authors.push(authorName);
  }

  return authors;
}

interface Package {
  location: string;
}

function getAllPackages(): Package[] {
  return JSON.parse(
    execSync(
      `lerna list -a --loglevel=error --json`,
      { cwd: packageRootPath }
    ).toString().trim()
  );
}

function renderAuthorsFileContent(authors: string[]): string {
  return `${authors.join('\n')}\n`;
}

const packages = getAllPackages();

for (const { location } of packages) {
  const packagePath = path.relative(packageRootPath, location);
  const authors = getAuthorsOrderedByFirstCommit(packagePath);
  fs.writeFileSync(path.resolve(packagePath, 'AUTHORS'), renderAuthorsFileContent(authors));
}

fs.writeFileSync(
  path.resolve(packageRootPath, 'AUTHORS'),
  renderAuthorsFileContent(getAuthorsOrderedByFirstCommit('.'))
);
