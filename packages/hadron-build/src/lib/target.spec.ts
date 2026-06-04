import { expect } from 'chai';
import { getTarget } from '../../test/test-helpers';

describe('target', function () {
  let env: NodeJS.ProcessEnv;

  beforeEach(function () {
    env = { ...process.env };
  });

  afterEach(function () {
    process.env = { ...env };
  });

  it('should have autoupdate endpoint resolved from the package.json config', async function () {
    const target = await getTarget();

    expect(target).to.have.property(
      'autoUpdateBaseUrl',
      'https://compass.mongodb.com'
    );
  });

  it('defaults to package.json distribution config options', async function () {
    const target = await getTarget({
      version: '1.2.0',
    });

    expect(target).to.have.property('distribution', 'compass');
    expect(target).to.have.property('name', 'mongodb-compass');
    expect(target).to.have.property('productName', 'MongoDB Compass');
    expect(target).to.have.property('readonly', false);
    expect(target).to.have.property('isolated', false);
    expect(target).to.have.property('version', '1.2.0');
  });

  it('allows to override distribution config with env vars', async function () {
    Object.assign(process.env, {
      HADRON_DISTRIBUTION: 'compass-isolated',
      HADRON_PRODUCT: 'compass-compass',
      HADRON_PRODUCT_NAME: 'MongoDB Compass Isolated Edition',
      HADRON_READONLY: 'true',
      HADRON_ISOLATED: 'true',
      HADRON_APP_VERSION: '1.2.3',
    });

    const target = await getTarget({
      // getTarget will set distribution to 'compass' by default, so we need to undefined it here
      distribution: undefined,
    });

    expect(target).to.have.property('distribution', 'compass-isolated');
    expect(target).to.have.property('name', 'compass-compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass Isolated Edition'
    );
    expect(target).to.have.property('readonly', true);
    expect(target).to.have.property('isolated', true);
    expect(target).to.have.property('version', '1.2.3');
  });
});
