import { expect } from 'chai';
import { setAppNameParamIfMissing } from './set-app-name-if-missing';

describe('setAppNameParamIfMissing', function () {
  it('leaves options unchanged if no default appName was specified', function () {
    expect(
      setAppNameParamIfMissing({
        connectionId: '123',
        telemetryAnonymousId: '789',
        isAtlas: false,
      })({
        connectionString: 'mongodb://localhost/',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/',
    });
  });

  it('leaves options unchanged if appName was already part of the connection string', function () {
    expect(
      setAppNameParamIfMissing({
        defaultAppName: 'defaultAppName',
        connectionId: '123',
        telemetryAnonymousId: '789',
        isAtlas: false,
      })({
        connectionString: 'mongodb://localhost/?appName=foobar',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?appName=foobar',
    });
  });

  it('sets appName to a default app name if not atlas and not already set', function () {
    expect(
      setAppNameParamIfMissing({
        defaultAppName: 'defaultAppName',
        connectionId: '123',
        telemetryAnonymousId: '789',
        isAtlas: false,
      })({
        connectionString: 'mongodb://localhost/',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?appName=defaultAppName',
    });
  });

  it('sets appName to a default app name, anonymous id, and connection id if it is atlas and not already set', function () {
    expect(
      setAppNameParamIfMissing({
        defaultAppName: 'defaultAppName',
        connectionId: '123',
        telemetryAnonymousId: '789',
        isAtlas: true,
      })({
        connectionString: 'mongodb://atlas/',
      })
    ).to.deep.equal({
      connectionString: 'mongodb://atlas/?appName=defaultAppName--789--123',
    });
  });
});
