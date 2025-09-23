import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import {
  FileUserData,
  AtlasUserData,
  type FileUserDataOptions,
} from './user-data';
import { z, type ZodError } from 'zod';
import sinon from 'sinon';

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
const dataType = 'RecentQueries';

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
      FileUserDataOptions<z.input<ReturnType<typeof getTestSchema>>>
    > = {},
    validatorOpts: ValidatorOptions = {}
  ) => {
    return new FileUserData(getTestSchema(validatorOpts), dataType, {
      basePath: tmpDir,
      ...userDataOpts,
    });
  };

  const writeFileToStorage = async (filepath: string, contents: string) => {
    const absolutePath = path.join(tmpDir, dataType, filepath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, 'utf-8');
  };

  context('UserData.readAll', function () {
    it('reads all files from the folder with defaults', async function () {
      await Promise.all(
        [
          ['data1.json', JSON.stringify({ name: 'VSCode' })],
          ['data2.json', JSON.stringify({ name: 'Mongosh' })],
        ].map(([filepath, data]) => writeFileToStorage(filepath, data))
      );

      const result = await getUserData().readAll();
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

    it('does not strip off unknown props that are unknown to validator when specified', async function () {
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
  });

  context('UserData.write', function () {
    it('writes file to the storage with content', async function () {
      const userData = getUserData();
      await userData.write('data', { name: 'VSCode' });

      const data = await userData.readOne('data');
      expect(data).to.deep.equal({ ...defaultValues(), name: 'VSCode' });
    });
  });

  context('UserData.delete', function () {
    it('deletes a file', async function () {
      const userData = getUserData();

      const fileId = 'data';
      const absolutePath = path.join(tmpDir, dataType, `${fileId}.json`);

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

      const absolutePath = path.join(tmpDir, dataType, 'serialized.json');

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

describe('AtlasUserData', function () {
  let sandbox: sinon.SinonSandbox;
  let authenticatedFetchStub: sinon.SinonStub;
  let getResourceUrlStub: sinon.SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    authenticatedFetchStub = sandbox.stub();
    getResourceUrlStub = sandbox.stub();
  });

  afterEach(function () {
    sandbox.restore();
  });

  const getAtlasUserData = (
    validatorOpts: ValidatorOptions = {},
    orgId = 'test-org',
    projectId = 'test-proj',
    type:
      | 'recentQueries'
      | 'favoriteQueries'
      | 'favoriteAggregations' = 'favoriteQueries'
  ) => {
    return new AtlasUserData(getTestSchema(validatorOpts), type, {
      orgId,
      projectId,
      getResourceUrl: getResourceUrlStub,
      authenticatedFetch: authenticatedFetchStub,
    });
  };

  const mockResponse = (data: unknown, ok = true, status = 200) => {
    return {
      ok,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
    };
  };

  context('AtlasUserData.write', function () {
    it('writes data successfully', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.write('test-id', { name: 'VSCode' });

      expect(result).to.be.true;
      expect(authenticatedFetchStub).to.have.been.calledOnce;

      const [url, options] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );
      expect(options.method).to.equal('POST');
      expect(options.headers['Content-Type']).to.equal('application/json');

      const body = JSON.parse(options.body as string);
      expect(body.data).to.be.a('string');
      expect(JSON.parse(body.data as string)).to.deep.equal({ name: 'VSCode' });
      expect(body.createdAt).to.be.a('string');
      expect(new Date(body.createdAt as string)).to.be.instanceOf(Date);
      // id and projectId should not be in the body (they're in the URL path)
      expect(body.id).to.be.undefined;
      expect(body.projectId).to.be.undefined;
    });

    it('returns false when authenticatedFetch throws an error', async function () {
      authenticatedFetchStub.rejects(
        new Error('HTTP 500: Internal Server Error')
      );
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.write('test-id', { name: 'VSCode' });
      expect(result).to.be.false;
    });

    it('validator removes unknown props', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.write('test-id', {
        name: 'VSCode',
        randomProp: 'should fail',
      });

      expect(result).to.be.true;
    });

    it('uses custom serializer when provided', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = new AtlasUserData(getTestSchema(), 'FavoriteQueries', {
        orgId: 'test-org',
        projectId: 'test-proj',
        getResourceUrl: getResourceUrlStub,
        authenticatedFetch: authenticatedFetchStub,
        serialize: (data) => `custom:${JSON.stringify(data)}`,
      });

      await userData.write('test-id', { name: 'Custom' });

      const [, options] = authenticatedFetchStub.firstCall.args;
      const body = JSON.parse(options.body as string);
      expect(body.data).to.equal('custom:{"name":"Custom"}');
      expect(body.createdAt).to.be.a('string');
    });
  });

  context('AtlasUserData.delete', function () {
    it('deletes data successfully', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
      );

      const userData = getAtlasUserData();
      const result = await userData.delete('test-id');

      expect(result).to.be.true;
      expect(authenticatedFetchStub).to.have.been.calledOnce;

      const [url, options] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
      );
      expect(options.method).to.equal('DELETE');
    });

    it('returns false when authenticatedFetch throws an error', async function () {
      authenticatedFetchStub.rejects(new Error('HTTP 404: Not Found'));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.delete('test-id');
      expect(result).to.be.false;
    });
  });

  context('AtlasUserData.readAll', function () {
    it('reads all data successfully with defaults', async function () {
      const responseData = [
        { data: JSON.stringify({ name: 'VSCode' }) },
        { data: JSON.stringify({ name: 'Mongosh' }) },
      ];
      authenticatedFetchStub.resolves(mockResponse(responseData));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(2);
      expect(result.errors).to.have.lengthOf(0);

      // Sort for consistent testing
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

      expect(authenticatedFetchStub).to.have.been.calledOnce;
      const [url, options] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );
      expect(options.method).to.equal('GET');
    });

    it('handles empty response', async function () {
      authenticatedFetchStub.resolves(mockResponse([]));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('handles non-array response', async function () {
      authenticatedFetchStub.resolves(mockResponse({ notAnArray: true }));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(1);
    });

    it('handles errors gracefully', async function () {
      authenticatedFetchStub.rejects(new Error('Unknown error'));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(1);
      expect(result.errors[0].message).to.equal('Unknown error');
    });

    it('handles authenticatedFetch errors gracefully', async function () {
      authenticatedFetchStub.rejects(
        new Error('HTTP 500: Internal Server Error')
      );
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(1);
      expect(result.errors[0].message).to.contain(
        'HTTP 500: Internal Server Error'
      );
    });

    it('uses custom deserializer when provided', async function () {
      const responseData = [{ data: 'custom:{"name":"Custom"}' }];
      authenticatedFetchStub.resolves(mockResponse(responseData));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = new AtlasUserData(getTestSchema(), 'FavoriteQueries', {
        orgId: 'test-org',
        projectId: 'test-proj',
        getResourceUrl: getResourceUrlStub,
        authenticatedFetch: authenticatedFetchStub,
        deserialize: (data) => {
          if (data.startsWith('custom:')) {
            return JSON.parse(data.slice(7));
          }
          return JSON.parse(data);
        },
      });

      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0]).to.deep.equal({
        ...defaultValues(),
        name: 'Custom',
      });
      expect(result.errors).to.have.lengthOf(0);
    });

    it('strips unknown props by default', async function () {
      const responseData = [
        {
          data: JSON.stringify({
            name: 'VSCode',
            unknownProp: 'should be stripped',
          }),
        },
      ];
      authenticatedFetchStub.resolves(mockResponse(responseData));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0]).to.deep.equal({
        ...defaultValues(),
        name: 'VSCode',
      });
      expect(result.data[0]).to.not.have.property('unknownProp');
      expect(result.errors).to.have.lengthOf(0);
    });
  });

  context('AtlasUserData.updateAttributes', function () {
    it('updates data successfully', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original Name', hasDarkMode: true }),
      };
      const putResponse = {};

      authenticatedFetchStub
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(putResponse));

      getResourceUrlStub
        .onFirstCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
        )
        .onSecondCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
        );

      const userData = getAtlasUserData();
      const result = await userData.updateAttributes('test-id', {
        name: 'Updated Name',
        hasDarkMode: false,
      });

      expect(result).equals(true);

      expect(authenticatedFetchStub).to.have.been.calledTwice;

      const [getUrl, getOptions] = authenticatedFetchStub.firstCall.args;
      expect(getUrl).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
      );
      expect(getOptions.method).to.equal('GET');

      const [putUrl, putOptions] = authenticatedFetchStub.secondCall.args;
      expect(putUrl).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
      );
      expect(putOptions.method).to.equal('PUT');
      expect(putOptions.headers['Content-Type']).to.equal('application/json');
    });

    it('returns false when authenticatedFetch throws an error', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original Name', hasDarkMode: true }),
      };

      authenticatedFetchStub
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .rejects(new Error('HTTP 400: Bad Request'));

      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
      );

      const userData = getAtlasUserData();
      const res = await userData.updateAttributes('test-id', {
        name: 'Updated',
      });
      expect(res).equals(false);
    });

    it('uses custom serializer for request body', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original Name', hasDarkMode: true }),
      };
      const putResponse = {};

      authenticatedFetchStub
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(putResponse));

      getResourceUrlStub
        .onFirstCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj'
        )
        .onSecondCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/test-org/test-proj/test-id'
        );

      const userData = new AtlasUserData(getTestSchema(), 'FavoriteQueries', {
        orgId: 'test-org',
        projectId: 'test-proj',
        getResourceUrl: getResourceUrlStub,
        authenticatedFetch: authenticatedFetchStub,
        serialize: (data) => `custom:${JSON.stringify(data)}`,
      });

      await userData.updateAttributes('test-id', { name: 'Updated' });

      const [, putOptions] = authenticatedFetchStub.secondCall.args;
      const body = JSON.parse(putOptions.body as string);
      expect(body.data).to.equal(
        'custom:{"name":"Updated","hasDarkMode":true,"hasWebSupport":false}'
      );
      expect(body.createdAt).to.be.a('string');
    });
  });

  context('AtlasUserData urls', function () {
    it('constructs URL correctly for write operation', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/custom-org/custom-proj/test-id'
      );

      const userData = getAtlasUserData({}, 'custom-org', 'custom-proj');
      await userData.write('test-id', { name: 'Test' });

      const [url] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/custom-org/custom-proj/test-id'
      );
    });

    it('constructs URL correctly for delete operation', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456/item789'
      );

      const userData = getAtlasUserData({}, 'org123', 'proj456');
      await userData.delete('item789');

      const [url] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456/item789'
      );
    });

    it('constructs URL correctly for read operation', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org456/proj123'
      );

      const userData = getAtlasUserData({}, 'org456', 'proj123');

      await userData.readAll();

      const [url] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org456/proj123'
      );
    });

    it('constructs URL correctly for update operation', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original', hasDarkMode: true }),
      };
      const putResponse = {};

      authenticatedFetchStub
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(putResponse));

      getResourceUrlStub
        .onFirstCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456'
        )
        .onSecondCall()
        .returns(
          'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456/item789'
        );

      const userData = getAtlasUserData({}, 'org123', 'proj456');
      await userData.updateAttributes('item789', { name: 'Updated' });

      expect(authenticatedFetchStub).to.have.been.calledTwice;

      const [getUrl] = authenticatedFetchStub.firstCall.args;
      expect(getUrl).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456'
      );

      const [putUrl] = authenticatedFetchStub.secondCall.args;
      expect(putUrl).to.equal(
        'cluster-connection.cloud.mongodb.com/favoriteQueries/org123/proj456/item789'
      );
    });

    it('constructs URL correctly for different types', async function () {
      authenticatedFetchStub.resolves(mockResponse({}));
      getResourceUrlStub.returns(
        'cluster-connection.cloud.mongodb.com/recentQueries/org123/proj456'
      );

      const userData = getAtlasUserData(
        {},
        'org123',
        'proj456',
        'recentQueries'
      );
      await userData.write('item789', { name: 'Recent Item' });

      const [url] = authenticatedFetchStub.firstCall.args;
      expect(url).to.equal(
        'cluster-connection.cloud.mongodb.com/recentQueries/org123/proj456'
      );
    });
  });
});
