import { expect } from 'chai';
import { z } from 'zod';
import sinon from 'sinon';
import { UserData, type UserDataType } from './user-data';

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
    return validator.loose();
  }

  return validator;
};

const defaultValues = () => getTestSchema().parse({});

describe('UserData with an Atlas environment', function () {
  let sandbox: sinon.SinonSandbox;
  let atlasServiceStub: {
    userDataEndpoint: sinon.SinonStub;
    userScopedUserDataEndpoint: sinon.SinonStub;
    authenticatedFetch: sinon.SinonStub;
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    atlasServiceStub = {
      userDataEndpoint: sandbox.stub(),
      userScopedUserDataEndpoint: sandbox.stub(),
      authenticatedFetch: sandbox.stub(),
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  const getAtlasUserData = (
    validatorOpts: ValidatorOptions = {},
    orgId = 'test-org',
    projectId = 'test-proj',
    type: Exclude<UserDataType, 'AppPreferences'> = 'FavoriteQueries'
  ) => {
    return new UserData(getTestSchema(validatorOpts), type, {
      kind: 'atlas',
      orgId,
      projectId,
      atlasService: atlasServiceStub,
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

  context('UserData.write', function () {
    it('writes data successfully', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.write('test-id', { name: 'VSCode' });

      expect(result).to.be.true;
      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledOnce;

      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );
      expect(options.method).to.equal('PUT');
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
      atlasServiceStub.authenticatedFetch.rejects(
        new Error('HTTP 500: Internal Server Error')
      );
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.write('test-id', { name: 'VSCode' });
      expect(result).to.be.false;
    });

    it('validator removes unknown props', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.write('test-id', {
        name: 'VSCode',
        randomProp: 'should fail',
      } as z.input<ReturnType<typeof getTestSchema>>);

      expect(result).to.be.true;
    });

    it('uses custom serializer when provided', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = new UserData(
        getTestSchema(),
        'FavoriteQueries',
        {
          kind: 'atlas',
          orgId: 'test-org',
          projectId: 'test-proj',
          atlasService: atlasServiceStub,
        },
        { serialize: (data) => `custom:${JSON.stringify(data)}` }
      );

      await userData.write('test-id', { name: 'Custom' });

      const [, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      const body = JSON.parse(options.body as string);
      expect(body.data).to.equal('custom:{"name":"Custom"}');
      expect(body.createdAt).to.be.a('string');
    });
  });

  context('UserData.delete', function () {
    it('deletes data successfully', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
      );

      const userData = getAtlasUserData();
      const result = await userData.delete('test-id');

      expect(result).to.be.true;
      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledOnce;

      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
      );
      expect(options.method).to.equal('DELETE');
    });

    it('returns false when authenticatedFetch throws an error', async function () {
      atlasServiceStub.authenticatedFetch.rejects(
        new Error('HTTP 404: Not Found')
      );
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();

      const result = await userData.delete('test-id');
      expect(result).to.be.false;
    });
  });

  context('UserData.readAll', function () {
    it('reads all data successfully with defaults', async function () {
      const responseData = [
        { data: JSON.stringify({ name: 'VSCode' }) },
        { data: JSON.stringify({ name: 'Mongosh' }) },
      ];
      atlasServiceStub.authenticatedFetch.resolves(mockResponse(responseData));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
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

      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledOnce;
      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );
      expect(options.method).to.equal('GET');
    });

    it('handles empty response', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse([]));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('handles non-array response', async function () {
      atlasServiceStub.authenticatedFetch.resolves(
        mockResponse({ notAnArray: true })
      );
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(1);
    });

    it('handles errors gracefully', async function () {
      atlasServiceStub.authenticatedFetch.rejects(new Error('Unknown error'));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = getAtlasUserData();
      const result = await userData.readAll();

      expect(result.data).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(1);
      expect(result.errors[0].message).to.equal('Unknown error');
    });

    it('handles authenticatedFetch errors gracefully', async function () {
      atlasServiceStub.authenticatedFetch.rejects(
        new Error('HTTP 500: Internal Server Error')
      );
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
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
      atlasServiceStub.authenticatedFetch.resolves(mockResponse(responseData));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
      );

      const userData = new UserData(
        getTestSchema(),
        'FavoriteQueries',
        {
          kind: 'atlas',
          orgId: 'test-org',
          projectId: 'test-proj',
          atlasService: atlasServiceStub,
        },
        {
          deserialize: (data) => {
            if (data.startsWith('custom:')) {
              return JSON.parse(data.slice(7));
            }
            return JSON.parse(data);
          },
        }
      );

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
      atlasServiceStub.authenticatedFetch.resolves(mockResponse(responseData));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj'
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

  context('UserData user-scoped types', function () {
    const getUserScopedUserData = (type: UserDataType = 'AppPreferences') =>
      new UserData(getTestSchema(), type, {
        kind: 'atlas',
        atlasService: atlasServiceStub,
      });

    it('writes to the user-scoped endpoint without org/project ids', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userScopedUserDataEndpoint.returns(
        'cloud.mongodb.com/ui/userData/AppPreferences'
      );

      const userData = getUserScopedUserData();
      const result = await userData.write({ name: 'VSCode' });

      expect(result).to.be.true;
      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal('cloud.mongodb.com/ui/userData/AppPreferences');
      expect(options.method).to.equal('PUT');
      expect(
        atlasServiceStub.userScopedUserDataEndpoint
      ).to.have.been.calledOnceWith('AppPreferences');
    });

    it('readAll returns a single-element list when the endpoint returns one document', async function () {
      atlasServiceStub.authenticatedFetch.resolves(
        mockResponse({ data: JSON.stringify({ name: 'VSCode' }) })
      );
      atlasServiceStub.userScopedUserDataEndpoint.returns(
        'cloud.mongodb.com/ui/userData/AppPreferences'
      );

      const userData = getUserScopedUserData();
      const result = await userData.readAll();

      expect(result.errors).to.have.lengthOf(0);
      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0]).to.deep.equal({
        ...defaultValues(),
        name: 'VSCode',
      });
      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal('cloud.mongodb.com/ui/userData/AppPreferences');
      expect(options.method).to.equal('GET');
    });

    it('readOne reads the single document from the user-scoped endpoint', async function () {
      atlasServiceStub.authenticatedFetch.resolves(
        mockResponse({ data: JSON.stringify({ name: 'Mongosh' }) })
      );
      atlasServiceStub.userScopedUserDataEndpoint.returns(
        'cloud.mongodb.com/ui/userData/AppPreferences'
      );

      const userData = getUserScopedUserData();
      const result = await userData.readOne();

      expect(result).to.deep.equal({
        ...defaultValues(),
        name: 'Mongosh',
      });
      const [url, options] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal('cloud.mongodb.com/ui/userData/AppPreferences');
      expect(options.method).to.equal('GET');
    });
  });

  context('UserData.readOne', function () {
    const statusError = (statusCode: number) =>
      Object.assign(new Error(`${statusCode}`), { statusCode });

    it('reads a missing document as undefined even when errors are not ignored', async function () {
      atlasServiceStub.authenticatedFetch.rejects(statusError(404));

      const userData = getAtlasUserData();

      expect(await userData.readOne('id', { ignoreErrors: false })).to.equal(
        undefined
      );
    });

    it('throws a failed request when errors are not ignored', async function () {
      atlasServiceStub.authenticatedFetch.rejects(statusError(500));

      const userData = getAtlasUserData();
      const error = await userData
        .readOne('id', { ignoreErrors: false })
        .catch((err: unknown) => err);

      expect(error).to.have.property('statusCode', 500);
    });

    it('reads a failed request as undefined by default', async function () {
      atlasServiceStub.authenticatedFetch.rejects(statusError(500));

      const userData = getAtlasUserData();

      expect(await userData.readOne('id')).to.equal(undefined);
    });
  });

  context('UserData.updateAttributes', function () {
    it('updates data successfully', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original Name', hasDarkMode: true }),
      };
      const putResponse = {};

      atlasServiceStub.authenticatedFetch
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(putResponse));

      atlasServiceStub.userDataEndpoint
        .onFirstCall()
        .returns('cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id')
        .onSecondCall()
        .returns(
          'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
        );

      const userData = getAtlasUserData();
      const result = await userData.updateAttributes('test-id', {
        name: 'Updated Name',
        hasDarkMode: false,
      });

      expect(result).equals(true);

      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledTwice;

      const [getUrl, getOptions] =
        atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(getUrl).to.equal(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
      );
      expect(getOptions.method).to.equal('GET');

      const [putUrl, putOptions] =
        atlasServiceStub.authenticatedFetch.secondCall.args;
      expect(putUrl).to.equal(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
      );
      expect(putOptions.method).to.equal('PUT');
      expect(putOptions.headers['Content-Type']).to.equal('application/json');
    });

    it('returns false when authenticatedFetch throws an error', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original Name', hasDarkMode: true }),
      };

      atlasServiceStub.authenticatedFetch
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .rejects(new Error('HTTP 400: Bad Request'));

      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
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

      atlasServiceStub.authenticatedFetch
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(putResponse));

      atlasServiceStub.userDataEndpoint
        .onFirstCall()
        .returns('cloud.mongodb.com/FavoriteQueries/test-org/test-proj')
        .onSecondCall()
        .returns(
          'cloud.mongodb.com/FavoriteQueries/test-org/test-proj/test-id'
        );

      const userData = new UserData(
        getTestSchema(),
        'FavoriteQueries',
        {
          kind: 'atlas',
          orgId: 'test-org',
          projectId: 'test-proj',
          atlasService: atlasServiceStub,
        },
        { serialize: (data) => `custom:${JSON.stringify(data)}` }
      );

      await userData.updateAttributes('test-id', { name: 'Updated' });

      const [, putOptions] =
        atlasServiceStub.authenticatedFetch.secondCall.args;
      const body = JSON.parse(putOptions.body as string);
      expect(body.data).to.equal(
        'custom:{"name":"Updated","hasDarkMode":true,"hasWebSupport":false}'
      );
      expect(body.createdAt).to.be.a('string');
    });
  });

  context('UserData urls', function () {
    it('constructs URL correctly for write operation', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/custom-org/custom-proj/test-id'
      );

      const userData = getAtlasUserData({}, 'custom-org', 'custom-proj');
      await userData.write('test-id', { name: 'Test' });

      const [url] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal(
        'cloud.mongodb.com/FavoriteQueries/custom-org/custom-proj/test-id'
      );
    });

    it('constructs URL correctly for delete operation', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/org123/proj456/item789'
      );

      const userData = getAtlasUserData({}, 'org123', 'proj456');
      await userData.delete('item789');

      const [url] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal(
        'cloud.mongodb.com/FavoriteQueries/org123/proj456/item789'
      );
    });

    it('constructs URL correctly for read operation', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/FavoriteQueries/org456/proj123'
      );

      const userData = getAtlasUserData({}, 'org456', 'proj123');

      await userData.readAll();

      const [url] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal('cloud.mongodb.com/FavoriteQueries/org456/proj123');
    });

    it('constructs URL correctly for update operation', async function () {
      const getResponse = {
        data: JSON.stringify({ name: 'Original', hasDarkMode: true }),
      };
      const putResponse = {};

      atlasServiceStub.authenticatedFetch
        .onFirstCall()
        .resolves(mockResponse(getResponse))
        .onSecondCall()
        .resolves(mockResponse(getResponse))
        .onThirdCall()
        .resolves(mockResponse(putResponse));

      atlasServiceStub.userDataEndpoint
        .withArgs('org123', 'proj456', 'FavoriteQueries', undefined)
        .returns('cloud.mongodb.com/FavoriteQueries/org123/proj456');
      atlasServiceStub.userDataEndpoint
        .withArgs('org123', 'proj456', 'FavoriteQueries', 'item789')
        .returns('cloud.mongodb.com/FavoriteQueries/org123/proj456/item789');

      const userData = getAtlasUserData({}, 'org123', 'proj456');
      await userData.readAll();
      await userData.updateAttributes('item789', { name: 'Updated' });

      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledThrice;

      const [getUrl] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(getUrl).to.equal(
        'cloud.mongodb.com/FavoriteQueries/org123/proj456'
      );

      const [putUrl] = atlasServiceStub.authenticatedFetch.thirdCall.args;
      expect(putUrl).to.equal(
        'cloud.mongodb.com/FavoriteQueries/org123/proj456/item789'
      );
    });

    it('constructs URL correctly for different types', async function () {
      atlasServiceStub.authenticatedFetch.resolves(mockResponse({}));
      atlasServiceStub.userDataEndpoint.returns(
        'cloud.mongodb.com/RecentQueries/org123/proj456'
      );

      const userData = getAtlasUserData(
        {},
        'org123',
        'proj456',
        'RecentQueries'
      );
      await userData.write('item789', { name: 'Recent Item' });

      const [url] = atlasServiceStub.authenticatedFetch.firstCall.args;
      expect(url).to.equal('cloud.mongodb.com/RecentQueries/org123/proj456');
    });
  });
});
