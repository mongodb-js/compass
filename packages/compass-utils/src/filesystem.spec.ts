import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import * as getStoragePaths from './get-storage-paths';
import { Filesystem } from './filesystem';

const getAbsolutePath = (tmpDir: string, filename: string) => {
  return path.join(tmpDir, filename);
};

const writeFileToStorage = async (filepath: string, contents: string) => {
  // At this point, getStoragePaths is already mocked and returns a tmpDir
  const absolutePath = getAbsolutePath(getStoragePaths.getAppPath()!, filepath);
  await fs.writeFile(absolutePath, contents, 'utf-8');
};

describe('filesystem', function () {
  let tmpDir: string;
  let sandbox: Sinon.SinonSandbox;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-tests'));
    sandbox = Sinon.createSandbox();
    sandbox.stub(getStoragePaths, 'getAppPath').returns(tmpDir);
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
    sandbox.restore();
  });

  context('Filesystem.readAll', function () {
    it('does not throw if the subdir does not exist and returns an empty list', async function () {
      const filesystem = new Filesystem({
        subdir: 'something/non-existant',
      });
      const data = await filesystem.readAll();
      expect(data).to.have.lengthOf(0);
    });

    it('reads all files from the folder by default', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ a: 1 })],
          ['data2.json', JSON.stringify({ b: 2 })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const data = await new Filesystem().readAll();
      expect(data).to.deep.equal([{ a: 1 }, { b: 2 }]);
    });

    it('filters files based on the pattern', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ a: 1 })],
          ['some.json', JSON.stringify({ b: 2 })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const filesystem = new Filesystem();

      {
        const data = await filesystem.readAll('*1.json');
        expect(data).to.deep.equal([{ a: 1 }]);
      }

      {
        const data = await filesystem.readAll('*.txt');
        expect(data).to.deep.equal([]);
      }

      {
        const data = await filesystem.readAll('some.json');
        expect(data).to.deep.equal([{ b: 2 }]);
      }
    });
  });

  context('Filesystem.readOne', function () {
    it('does not throw if the subdir does not exist and returns undefined', async function () {
      const filesystem = new Filesystem({
        subdir: 'something/non-existant',
      });
      const data = await filesystem.readOne('');
      expect(data).to.be.undefined;
    });

    it('does not throw if the file does not exist and returns undefined', async function () {
      const filesystem = new Filesystem();
      const data = await filesystem.readOne('something.json');
      expect(data).to.be.undefined;
    });

    it('reads the file', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ a: 1 })],
          ['data2.json', JSON.stringify({ b: 2 })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const filesystem = new Filesystem();

      {
        const data = await filesystem.readOne('data1.json');
        expect(data).to.deep.equal({ a: 1 });
      }

      {
        const data = await filesystem.readOne('data2.json');
        expect(data).to.deep.equal({ b: 2 });
      }
    });
  });

  context('Filesystem.write', function () {
    it('does not throw if the subdir does not exist', async function () {
      const filesystem = new Filesystem({
        subdir: 'something/non-existant',
      });
      const isWritten = await filesystem.write('data.json', { w: 1 });
      expect(isWritten).to.be.true;
    });

    it('writes file to the storage with content', async function () {
      const filesystem = new Filesystem();
      await filesystem.write('data.json', { w: 2 });

      const data = await filesystem.readOne('data.json');
      expect(data).to.deep.equal({ w: 2 });
    });
  });

  context('Filesystem.delete', function () {
    it('does not throw if the subdir does not exist', async function () {
      const filesystem = new Filesystem({
        subdir: 'something/non-existant',
      });
      const isDeleted = await filesystem.delete('data.json');
      expect(isDeleted).to.be.false;
    });

    it('deletes a file', async function () {
      const filesystem = new Filesystem();

      const filename = 'data.json';
      const absolutePath = path.join(tmpDir, filename);

      await filesystem.write(filename, { d: 2 });

      // verify file exists in fs
      await fs.access(absolutePath);

      const isDeleted = await filesystem.delete(filename);
      expect(isDeleted).to.be.true;

      try {
        await fs.access(absolutePath);
      } catch (error) {
        expect((error as any).code).to.equal('ENOENT');
      }
    });
  });

  context('Filesystem.serialization', function () {
    it('supports custom serializer', async function () {
      const filesystem = new Filesystem({
        onSerialize: () => {
          return 'ping';
        },
      });

      const filename = 'data.json';
      const absolutePath = getAbsolutePath(tmpDir, filename);

      await filesystem.write('data.json', 'something');

      const writtenData = (await fs.readFile(absolutePath)).toString();
      expect(writtenData).to.equal('ping');
    });

    it('supports custom deserializer', async function () {
      const filesystem = new Filesystem({
        onDeserialize: () => {
          return 'pong';
        },
      });

      const filename = 'data.json';
      const absolutePath = getAbsolutePath(tmpDir, filename);

      // write nothing and when filesystem reads and deserializes it,
      // it should return pong
      await fs.writeFile(absolutePath, '', 'utf-8');

      const data = await filesystem.readOne(filename);
      expect(data).to.equal('pong');
    });
  });
});
