import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { Filesystem } from './filesystem';

describe('filesystem', function () {
  const initialBaseStoragePath = process.env.COMPASS_TESTS_STORAGE_BASE_PATH;
  let tmpDir: string;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-tests'));
    process.env.COMPASS_TESTS_STORAGE_BASE_PATH = tmpDir;
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
    if (initialBaseStoragePath) {
      process.env.COMPASS_TESTS_STORAGE_BASE_PATH = initialBaseStoragePath;
    } else {
      delete process.env.COMPASS_TESTS_STORAGE_BASE_PATH;
    }
  });

  const writeFileToStorage = async (filepath: string, contents: string) => {
    const absolutePath = path.join(tmpDir, filepath);
    await fs.writeFile(absolutePath, contents, 'utf-8');
  };

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
          ['data2.json', JSON.stringify({ a: 2 })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const data = await new Filesystem().readAll();
      // sort
      data.sort((first: any, second: any) => first.a - second.a);
      expect(data).to.deep.equal([{ a: 1 }, { a: 2 }]);
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
    it('throws if the file does not exist', function () {
      const filesystem = new Filesystem();
      expect(async () => await filesystem.readOne('something.json')).to.throw;
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
      const absolutePath = path.join(tmpDir, filename);

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
      const absolutePath = path.join(tmpDir, filename);

      // write nothing and when filesystem reads and deserializes it,
      // it should return pong
      await fs.writeFile(absolutePath, '', 'utf-8');

      const data = await filesystem.readOne(filename);
      expect(data).to.equal('pong');
    });
  });
});
