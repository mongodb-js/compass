import fs from 'fs/promises';
import { Stats } from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { UserData, type UserDataOptions } from './user-data';
import { z, type ZodError } from 'zod';

type ValidatorOptions = {
  allowUnknownProps?: boolean;
};
const getTestSchema = (
  options: ValidatorOptions = {
    allowUnknownProps: false,
  }
) => {
  const validator = z.object({
    name: z.string().default('Compass'),
    hasDarkMode: z.boolean().default(true),
    hasWebSupport: z.boolean().default(false),
    ctimeMs: z.number().optional(),
  });

  if (options.allowUnknownProps) {
    return validator.passthrough();
  }

  return validator;
};

const defaultValues = () => getTestSchema().parse({});
const subdir = 'test-dir';

describe('user-data', function () {
  let tmpDir: string;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'user-data-tests'));
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  const getUserData = (
    userDataOpts: Partial<
      UserDataOptions<z.input<ReturnType<typeof getTestSchema>>>
    > = {},
    validatorOpts: ValidatorOptions = {}
  ) => {
    return new UserData(getTestSchema(validatorOpts), {
      subdir,
      basePath: tmpDir,
      ...userDataOpts,
    });
  };

  const writeFileToStorage = async (filepath: string, contents: string) => {
    const absolutePath = path.join(tmpDir, subdir, filepath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, 'utf-8');
  };

  context('UserData.readAll', function () {
    it('does not throw if the subdir does not exist and returns an empty list', async function () {
      const userData = getUserData({
        subdir: 'something/non-existant',
      });
      const result = await userData.readAll();
      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('reads all files from the folder with defaults', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ name: 'VSCode' })],
          ['data2.json', JSON.stringify({ name: 'Mongosh' })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const result = await getUserData().readAll();
      // sort
      result.data.sort((first, second) =>
        first.name.localeCompare(second.name)
      );
      expect(result.data).to.deep.equal([
        {
          ...defaultValues(),
          name: 'Mongosh',
        },
        {
          ...defaultValues(),
          name: 'VSCode',
        },
      ]);
    });

    it('ignores parse errors', async function () {
      await Promise.all(
        [
          ['data1.json', '{ a: }'],
          ['data2.json', '{ a: }'],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const result = await getUserData().readAll({
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
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const result = await getUserData().readAll({
        ignoreErrors: false,
      });
      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(2);
    });

    it('returns file stats', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ name: 'VSCode' })],
          ['data2.json', JSON.stringify({ name: 'Mongosh' })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const { data } = await getUserData().readAllWithStats({
        ignoreErrors: true,
      });

      {
        const vscodeData = data.find((x) => x[0].name === 'VSCode');
        expect(vscodeData?.[0]).to.deep.equal({
          name: 'VSCode',
          hasDarkMode: true,
          hasWebSupport: false,
        });
        expect(vscodeData?.[1]).to.be.instanceOf(Stats);
      }

      {
        const mongoshData = data.find((x) => x[0].name === 'Mongosh');
        expect(mongoshData?.[0]).to.deep.equal({
          name: 'Mongosh',
          hasDarkMode: true,
          hasWebSupport: false,
        });
        expect(mongoshData?.[1]).to.be.instanceOf(Stats);
      }
    });
  });

  context('UserData.readOne', function () {
    it('throws if the file does not exist', async function () {
      try {
        await getUserData().readOne('something.json', {
          ignoreErrors: false,
        });
        expect.fail('Failed to read the file');
      } catch (e) {
        expect(e).to.be.an.instanceOf(Error);
        expect((e as any).code).to.equal('ENOENT');
      }
    });

    it('reads the file with default values', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ name: 'Compass' })],
          ['data2.json', JSON.stringify({ name: 'Mongosh' })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const userData = getUserData();

      {
        const data = await userData.readOne('data1');
        expect(data).to.deep.equal({ ...defaultValues(), name: 'Compass' });
      }

      {
        const data = await userData.readOne('data2');
        expect(data).to.deep.equal({ ...defaultValues(), name: 'Mongosh' });
      }
    });

    it('ignores read error', async function () {
      const result = await getUserData().readOne('something', {
        ignoreErrors: true,
      });
      expect(result).to.be.undefined;
    });

    it('throws read error', async function () {
      const storage = getUserData();
      try {
        await storage.readOne('something.json', {
          ignoreErrors: false,
        });
        expect.fail('missed exception');
      } catch (e) {
        expect((e as any).code).to.equal('ENOENT');
      }
    });

    it('ignores parse error', async function () {
      await writeFileToStorage('data.json', '{a: b}');
      const result = await getUserData().readOne('data', {
        ignoreErrors: true,
      });
      expect(result).to.be.undefined;
    });

    it('throws parse errors', async function () {
      await writeFileToStorage('data.json', '{a: b}');

      const storage = getUserData();
      try {
        await storage.readOne('data', {
          ignoreErrors: false,
        });
        expect.fail('missed exception');
      } catch (e) {
        expect((e as Error).message).to.match(
          /Unexpected token|Expected property name or/
        ); // Node.js 18 vs 20
      }
    });

    it('throws if data is parsable, but invalid', async function () {
      await writeFileToStorage(
        'data.json',
        JSON.stringify({
          name: 'Compass',
          hasDarkMode: 'something',
        })
      );

      try {
        await getUserData().readOne('data', {
          ignoreErrors: false,
        });
        expect.fail('missed exception');
      } catch (e) {
        const errors = (e as ZodError).errors;
        expect(errors[0].message).to.contain(
          'Expected boolean, received string'
        );
      }
    });

    it('strips off unknown props that are unknown to validator by default', async function () {
      await writeFileToStorage(
        'data.json',
        JSON.stringify({
          name: 'Mongosh',
          company: 'MongoDB',
        })
      );

      const data = await getUserData().readOne('data', {
        ignoreErrors: false,
      });

      expect(data).to.deep.equal({
        ...defaultValues(),
        name: 'Mongosh',
      });
    });

    it('does not strip off unknown props that are unknow to validator when specified', async function () {
      await writeFileToStorage(
        'data.json',
        JSON.stringify({
          name: 'Mongosh',
          company: 'MongoDB',
        })
      );

      const data = await getUserData(
        {},
        {
          allowUnknownProps: true,
        }
      ).readOne('data', {
        ignoreErrors: false,
      });

      expect(data).to.deep.equal({
        ...defaultValues(),
        name: 'Mongosh',
        company: 'MongoDB',
      });
    });

    it('return file stats', async function () {
      await writeFileToStorage(
        'data.json',
        JSON.stringify({
          name: 'Mongosh',
          company: 'MongoDB',
        })
      );

      const [data, stats] = await getUserData().readOneWithStats('data', {
        ignoreErrors: false,
      });

      expect(data).to.deep.equal({
        name: 'Mongosh',
        hasDarkMode: true,
        hasWebSupport: false,
      });
      expect(stats).to.be.instanceOf(Stats);
    });
  });

  context('UserData.write', function () {
    it('does not throw if the subdir does not exist', async function () {
      const userData = getUserData({
        subdir: 'something/non-existant',
      });
      const isWritten = await userData.write('data', { w: 1 });
      expect(isWritten).to.be.true;
    });

    it('writes file to the storage with content', async function () {
      const userData = getUserData();
      await userData.write('data', { name: 'VSCode' });

      const data = await userData.readOne('data');
      expect(data).to.deep.equal({ ...defaultValues(), name: 'VSCode' });
    });
  });

  context('UserData.delete', function () {
    it('does not throw if the subdir does not exist', async function () {
      const userData = getUserData({
        subdir: 'something/non-existant',
      });
      const isDeleted = await userData.delete('data.json');
      expect(isDeleted).to.be.false;
    });

    it('deletes a file', async function () {
      const userData = getUserData();

      const fileId = 'data';
      const absolutePath = path.join(tmpDir, subdir, `${fileId}.json`);

      await userData.write(fileId, { name: 'Compass' });

      // verify file exists in fs
      await fs.access(absolutePath);

      const isDeleted = await userData.delete(fileId);
      expect(isDeleted).to.be.true;

      try {
        await fs.access(absolutePath);
        expect.fail('missed exception');
      } catch (error) {
        expect((error as any).code).to.equal('ENOENT');
      }
    });
  });

  context('UserData.serialization', function () {
    it('supports custom serializer', async function () {
      const data = {
        name: 'Serializer',
      };

      const userData = getUserData({
        serialize: (x) => {
          expect(x).to.deep.equal(data);
          return JSON.stringify(x);
        },
      });

      await userData.write('serialized', data);

      const absolutePath = path.join(tmpDir, subdir, 'serialized.json');

      const writtenData = JSON.parse(
        (await fs.readFile(absolutePath)).toString()
      );
      expect(writtenData).to.deep.equal(data);
    });

    it('supports custom deserializer', async function () {
      const userData = getUserData({
        deserialize: (x) => {
          expect(x).to.equal('{}');
          return JSON.parse(x);
        },
      });

      const fileId = 'deserialized';

      await writeFileToStorage(`${fileId}.json`, '{}');

      const data = await userData.readOne(fileId);
      expect(data).to.deep.equal({
        ...defaultValues(),
        ...data,
      });
    });
  });
});
