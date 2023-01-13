import { expect } from 'chai';
import { setAppNameParamIfMissing } from './set-app-name-if-missing';

describe('setAppNameParamIfMissing', function () {
  it('leaves options unchanged if no default appName was specified', function () {
    expect(
      setAppNameParamIfMissing()({
        connectionString: 'mongodb://localhost/',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/',
    });
  });

  it('leaves options unchanged if appName was already part of the connection string', function () {
    expect(
      setAppNameParamIfMissing('defaultAppName')({
        connectionString: 'mongodb://localhost/?appName=foobar',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?appName=foobar',
    });
  });

  it('sets appName to a default value if not already set', function () {
    expect(
      setAppNameParamIfMissing('defaultAppName')({
        connectionString: 'mongodb://localhost/',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?appName=defaultAppName',
    });
  });
});
