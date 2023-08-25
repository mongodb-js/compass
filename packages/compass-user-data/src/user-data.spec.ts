import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { UserData } from './user-data';

describe('user-data', function () {
  let tmpDir: string;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'user-data-tests'));
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  const writeFileToStorage = async (
    basedir: string,
    filepath: string,
    contents: string
  ) => {
    const absolutePath = path.join(tmpDir, basedir, filepath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, 'utf-8');
  };

  context('UserData.readAll', function () {
    it('does not throw if the subdir does not exist and returns an empty list', async function () {
      const userData = new UserData({
        subdir: 'something/non-existant',
        basePath: tmpDir,
      });
      const result = await userData.readAll();
      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('reads all files from the folder', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ a: 1 })],
          ['data2.json', JSON.stringify({ a: 2 })],
        ].map(([filepath, data]) =>
          writeFileToStorage('pipelines', filepath, data)
        )
      );

      const result = await new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      }).readAll();
      // sort
      result.data.sort((first: any, second: any) => first.a - second.a);
      expect(result.data).to.deep.equal([{ a: 1 }, { a: 2 }]);
    });

    it('ignores parse errors', async function () {
      await Promise.all(
        [
          ['data1.json', '{ a: }'],
          ['data2.json', '{ a: }'],
        ].map(([filepath, data]) =>
          writeFileToStorage('pipelines', filepath, data)
        )
      );

      const result = await new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      }).readAll({
        ignoreErrors: true,
      });
      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('throws parse errors', async function () {
      await Promise.all(
        [
          ['data1.json', '{ a: }'],
          ['data2.json', '{ a: }'],
        ].map(([filepath, data]) =>
          writeFileToStorage('pipelines', filepath, data)
        )
      );

      const result = await new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      }).readAll({
        ignoreErrors: false,
      });
      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(2);
    });
  });

  context('UserData.readOne', function () {
    it('throws if the file does not exist', function () {
      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });
      expect(async () => await userData.readOne('something.json')).to.throw;
    });

    it('reads the file', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ a: 1 })],
          ['data2.json', JSON.stringify({ b: 2 })],
        ].map(([filepath, data]) =>
          writeFileToStorage('pipelines', filepath, data)
        )
      );

      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });

      {
        const data = await userData.readOne('data1.json');
        expect(data).to.deep.equal({ a: 1 });
      }

      {
        const data = await userData.readOne('data2.json');
        expect(data).to.deep.equal({ b: 2 });
      }
    });

    it('ignores read error', async function () {
      const result = await new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      }).readOne('something.json', {
        ignoreErrors: true,
      });
      expect(result).to.be.undefined;
    });

    it('throws read error', async function () {
      const storage = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });
      try {
        await storage.readOne('something.json', {
          ignoreErrors: false,
        });
      } catch (e) {
        expect((e as any).code).to.equal('ENOENT');
      }
    });

    it('ignores parse error', async function () {
      await writeFileToStorage('pipelines', 'data.json', '{a: b}');
      const result = await new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      }).readOne('data.json', {
        ignoreErrors: true,
      });
      expect(result).to.be.undefined;
    });

    it('throws parse errors', async function () {
      await writeFileToStorage('pipelines', 'data.json', '{a: b}');

      const storage = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });
      try {
        await storage.readOne('data.json', {
          ignoreErrors: false,
        });
      } catch (e) {
        expect((e as Error).message).to.contain('Unexpected token');
      }
    });
  });

  context('UserData.write', function () {
    it('does not throw if the subdir does not exist', async function () {
      const userData = new UserData({
        subdir: 'something/non-existant',
        basePath: tmpDir,
      });
      const isWritten = await userData.write('data.json', { w: 1 });
      expect(isWritten).to.be.true;
    });

    it('writes file to the storage with content', async function () {
      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });
      await userData.write('data.json', { w: 2 });

      const data = await userData.readOne('data.json');
      expect(data).to.deep.equal({ w: 2 });
    });
  });

  context('UserData.delete', function () {
    it('does not throw if the subdir does not exist', async function () {
      const userData = new UserData({
        subdir: 'something/non-existant',
        basePath: tmpDir,
      });
      const isDeleted = await userData.delete('data.json');
      expect(isDeleted).to.be.false;
    });

    it('deletes a file', async function () {
      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
      });

      const filename = 'data.json';
      const absolutePath = path.join(tmpDir, 'pipelines', filename);

      await userData.write(filename, { d: 2 });

      // verify file exists in fs
      await fs.access(absolutePath);

      const isDeleted = await userData.delete(filename);
      expect(isDeleted).to.be.true;

      try {
        await fs.access(absolutePath);
      } catch (error) {
        expect((error as any).code).to.equal('ENOENT');
      }
    });
  });

  context('UserData.serialization', function () {
    it('supports custom serializer', async function () {
      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
        serialize: () => {
          return 'ping';
        },
      });

      const filename = 'data.json';
      const absolutePath = path.join(tmpDir, 'pipelines', filename);

      await userData.write('data.json', 'something');

      const writtenData = (await fs.readFile(absolutePath)).toString();
      expect(writtenData).to.equal('ping');
    });

    it('supports custom deserializer', async function () {
      const userData = new UserData({
        subdir: 'pipelines',
        basePath: tmpDir,
        deserialize: () => {
          return 'pong';
        },
      });

      const filename = 'data.json';

      // write nothing and when userData reads and deserializes it,
      // it should return pong
      await writeFileToStorage('pipelines', filename, '');

      const data = await userData.readOne(filename);
      expect(data).to.equal('pong');
    });
  });
});
