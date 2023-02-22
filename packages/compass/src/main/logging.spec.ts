import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CompassLogging, extractPartialLogFile } from './logging';

describe('extractPartialLogFile', function () {
  let tmpdir: string;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      'compass-logging-test',
      `test-${Date.now()}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rm(tmpdir, { recursive: true });
  });

  it('should read an incomplete log file and write a decompressed version of it to a tmp file', async function () {
    const logFilePath = path.join(tmpdir, 'xyz.gz');
    await fs.writeFile(
      logFilePath,
      Buffer.from('H4sIAAAAAAAAA8pIzcnJVyjPL8pJUQQAAAD//w==', 'base64')
    );
    const tempFilePath = await extractPartialLogFile(logFilePath, tmpdir);
    const content = await fs.readFile(tempFilePath, 'utf8');
    expect(tempFilePath).to.eq(
      path.join(tmpdir, 'compass_logs', 'compass_xyz.txt')
    );
    expect(content).to.eq('hello world!');
  });

  it('should not throw when writing logs after end', async function () {
    const compassApp = {
      addExitHandler() {},
      on() {},
    };

    await CompassLogging.init(compassApp as any);

    CompassLogging['writer']?.end();
    CompassLogging['writer']?.write('hi');
  });
});
