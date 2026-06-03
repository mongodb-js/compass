import os from 'os';
import path from 'path';

/**
 * Path to the local socket the Compass GUI listens on for stdio bridges.
 *
 * On Linux/macOS this is an `AF_UNIX` socket under the user's runtime/state
 * directory. On Windows it is a named pipe under `\\.\pipe\`. In both cases
 * the OS enforces same-user access via filesystem permissions, so no
 * application-level token is required.
 */
export function getMcpSocketPath(): string {
  if (process.platform === 'win32') {
    return '\\\\.\\pipe\\mongodb-compass-mcp';
  }
  // Prefer XDG_RUNTIME_DIR on Linux when set (cleared at logout); fall back
  // to a stable location under the home directory.
  const runtimeDir =
    process.env.XDG_RUNTIME_DIR ||
    path.join(os.homedir(), '.config', 'mongodb-compass');
  return path.join(runtimeDir, 'mcp.sock');
}
