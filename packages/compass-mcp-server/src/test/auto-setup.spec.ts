import { expect } from 'chai';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import {
  installInClient,
  uninstallFromClient,
  detectInClient,
  MCP_SERVER_NAME,
} from '../auto-setup';
import * as clientPaths from '../client-paths';

const COMMAND =
  '/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass';
const ARGS = ['--mcp-stdio'];

describe('auto-setup', function () {
  let tmpDir: string;
  let getClientSpecStub: sinon.SinonStub;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-mcp-auto-setup-')
    );
    // Redirect every client to a fresh path in the temp dir so the tests
    // never touch the user's real config files.
    getClientSpecStub = sinon
      .stub(clientPaths, 'getClientSpec')
      .callsFake((client: clientPaths.AiClientId) => {
        const isVscode = client === 'vscode';
        return {
          id: client,
          label: client,
          configPath: path.join(tmpDir, `${client}.json`),
          serversKey: isVscode ? 'servers' : 'mcpServers',
        };
      });
  });

  afterEach(async function () {
    getClientSpecStub.restore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates a new config file when none exists', async function () {
    const result = await installInClient('claude', COMMAND, ARGS);
    expect(result.created).to.equal(true);
    expect(result.updated).to.equal(false);

    const content = await fs.readFile(result.configPath, 'utf-8');
    const parsed = JSON.parse(content) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    expect(parsed.mcpServers[MCP_SERVER_NAME].command).to.equal(COMMAND);
    expect(parsed.mcpServers[MCP_SERVER_NAME].args).to.deep.equal(ARGS);
  });

  it('preserves existing entries and JSONC comments when patching', async function () {
    const configPath = path.join(tmpDir, 'claude.json');
    await fs.writeFile(
      configPath,
      `{
  // my existing mcp servers
  "mcpServers": {
    "trino": {
      "command": "python3",
      "args": ["/tmp/trino.py"]
    }
  }
}
`,
      'utf-8'
    );

    const result = await installInClient('claude', COMMAND, ARGS);
    expect(result.created).to.equal(false);
    expect(result.updated).to.equal(false); // not previously installed

    const content = await fs.readFile(result.configPath, 'utf-8');
    // Comment must survive.
    expect(content).to.include('// my existing mcp servers');
    // Pre-existing entry must survive.
    expect(content).to.include('"trino"');
    // New entry present.
    expect(content).to.include(`"${MCP_SERVER_NAME}"`);
  });

  it('updates an existing mongodb-compass entry in place', async function () {
    await installInClient('claude', '/old/path', ['--mcp-stdio']);
    const result = await installInClient('claude', COMMAND, ARGS);
    expect(result.created).to.equal(false);
    expect(result.updated).to.equal(true);

    const detected = await detectInClient('claude', COMMAND, ARGS);
    expect(detected.installed).to.equal(true);
  });

  it('detects a missing entry as not installed', async function () {
    await fs.writeFile(
      path.join(tmpDir, 'cursor.json'),
      JSON.stringify({ mcpServers: { other: { command: 'x', args: [] } } }),
      'utf-8'
    );
    const detected = await detectInClient('cursor', COMMAND, ARGS);
    expect(detected.configExists).to.equal(true);
    expect(detected.installed).to.equal(false);
  });

  it('detects mismatched command/args as not installed (Update state)', async function () {
    await installInClient('claude', '/old/path', ['--mcp-stdio']);
    const detected = await detectInClient('claude', COMMAND, ARGS);
    expect(detected.installed).to.equal(false);
  });

  it('uses "servers" key for VS Code', async function () {
    const result = await installInClient('vscode', COMMAND, ARGS);
    const parsed = JSON.parse(
      await fs.readFile(result.configPath, 'utf-8')
    ) as Record<string, unknown>;
    expect(parsed).to.have.property('servers');
    expect(parsed).to.not.have.property('mcpServers');
  });

  it('removes our entry on uninstall without disturbing siblings', async function () {
    const configPath = path.join(tmpDir, 'claude.json');
    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          mcpServers: {
            trino: { command: 'python3', args: ['/tmp/trino.py'] },
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await installInClient('claude', COMMAND, ARGS);
    await uninstallFromClient('claude');

    const content = JSON.parse(await fs.readFile(configPath, 'utf-8')) as {
      mcpServers: Record<string, unknown>;
    };
    expect(content.mcpServers).to.not.have.property(MCP_SERVER_NAME);
    expect(content.mcpServers).to.have.property('trino');
  });

  it('reports configExists=false when the file is missing', async function () {
    const detected = await detectInClient('windsurf', COMMAND, ARGS);
    expect(detected.configExists).to.equal(false);
    expect(detected.installed).to.equal(false);
  });
});
