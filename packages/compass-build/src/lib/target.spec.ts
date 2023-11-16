import { expect } from 'chai';
import { getTestTarget } from '../../test/helpers';

describe('target', function () {
  let env;

  beforeEach(function () {
    env = { ...process.env };
  });

  afterEach(function () {
    process.env = { ...env };
  });

  it('should have autoupdate endpoint resolved from the package.json config', function () {
    const target = getTestTarget();

    expect(target).to.have.property(
      'autoUpdateBaseUrl',
      'https://compass.mongodb.com'
    );
  });

  it('defaults to package.json distribution config options', function () {
    const target = getTestTarget();

    expect(target).to.have.property('distribution', 'compass');
    expect(target).to.have.property('name', 'compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass Enterprise super long test name Beta'
    );
    expect(target).to.have.property('readonly', false);
    expect(target).to.have.property('isolated', false);
    expect(target).to.have.property('version', '1.2.0-beta');
    expect(target).to.have.property('channel', 'beta');
  });

  it('allows to override distribution config with env vars', function () {
    Object.assign(process.env, {
      HADRON_DISTRIBUTION: 'compass-readonly',
      HADRON_PRODUCT: 'compass-compass',
      HADRON_PRODUCT_NAME: 'MongoDB Compass My Awesome Edition',
      HADRON_READONLY: 'true',
      HADRON_ISOLATED: 'true',
      HADRON_APP_VERSION: '1.2.3',
    });

    const target = getTestTarget();

    expect(target).to.have.property('distribution', 'compass-readonly');
    expect(target).to.have.property('channel', 'stable'); // from new version
    expect(target).to.have.property('name', 'compass-compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass My Awesome Edition'
    );
    expect(target).to.have.property('readonly', true);
    expect(target).to.have.property('isolated', true);
    expect(target).to.have.property('version', '1.2.3');
  });
});
