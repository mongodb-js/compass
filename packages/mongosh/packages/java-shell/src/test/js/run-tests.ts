'use strict';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { once } from 'events';
import { startTestServer } from '../../../../../testing/integration-testing-hooks';

describe('java-shell tests', function() {
  this.timeout(600_000);
  const testServer = startTestServer('shared');
  const packageRoot = path.resolve(__dirname, '..', '..', '..') + '/';

  before(async function () {
    process.env.JAVA_SHELL_MONGOSH_TEST_URI = await testServer.connectionString();

    const connectionString = await testServer.connectionString();
    const mongosh = child_process.spawn(
      process.execPath,
      [ path.resolve(packageRoot, '..', 'cli-repl', 'bin', 'mongosh.js'), connectionString ],
      { stdio: [ 'pipe', 'inherit', 'inherit' ] });
    mongosh.stdin.write(`
      use admin;
      db.createUser({ user: "admin", pwd: "admin", roles: ["root"]});
      .exit
    `);
    await once(mongosh, 'exit');
  });

  it('passes the JavaShell tests', () => {
    if (process.platform !== 'win32') {
      child_process.execSync('./gradlew test --info', { stdio: 'inherit', cwd: packageRoot });
    } else {
      child_process.execSync('.\\gradlew.bat test --info', { stdio: 'inherit', cwd: packageRoot });
    }
  });
});

