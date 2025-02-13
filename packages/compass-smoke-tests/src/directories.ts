import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SANDBOXES_PATH = path.resolve(__dirname, '../.sandboxes');

export function deleteSandboxesDirectory() {
  fs.rmSync(SANDBOXES_PATH, { recursive: true, force: true });
}

export function sandboxesDirectoryExists() {
  return fs.existsSync(SANDBOXES_PATH);
}

function ensureSandboxesDirectory() {
  if (!sandboxesDirectoryExists()) {
    fs.mkdirSync(SANDBOXES_PATH, { recursive: true });
  }
  return SANDBOXES_PATH;
}

export function createSandbox() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const sandboxPath = path.resolve(ensureSandboxesDirectory(), nonce);
  assert.equal(
    fs.existsSync(sandboxPath),
    false,
    `Failed to create sandbox at '${sandboxPath}' - it already exists`
  );
  fs.mkdirSync(sandboxPath);
  return sandboxPath;
}

export function ensureDownloadsDirectory() {
  const downloadsPath = path.resolve(__dirname, '../.downloads');
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }
  return downloadsPath;
}
