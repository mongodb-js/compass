import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function ensureSandboxesDirectory() {
  const sandboxesPath = path.resolve(__dirname, '../.sandboxes');
  if (!fs.existsSync(sandboxesPath)) {
    fs.mkdirSync(sandboxesPath, { recursive: true });
  }
  return sandboxesPath;
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
