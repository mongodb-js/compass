const path = require('path');
const { expect } = require('chai');
const Target = require('../lib/target');

describe('target', () => {
  let env;

  beforeEach(() => {
    env = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('should have autoupdate endpoint resolved from the package.json config', () => {
    const target = new Target(path.join(__dirname, 'fixtures', 'hadron-app'));

    expect(target).to.have.property(
      'autoUpdateBaseUrl',
      'https://hadron-app.herokuapp.com'
    );
  });

  it('defaults to package.json distribution config options', () => {
    const target = new Target(path.join(__dirname, 'fixtures', 'hadron-app'));

    expect(target).to.have.property('distribution', 'compass');
    expect(target).to.have.property('name', 'compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass Enterprise super long test name Beta'
    );
    expect(target).to.have.property('readonly', false);
    expect(target).to.have.property('isolated', false);
    expect(target).to.have.property('version', '1.2.0-beta');
  });

  it('allows to override distribution config with env vars', () => {
    Object.assign(process.env, {
      HADRON_DISTRIBUTION: 'my-custom-distribution',
      HADRON_PRODUCT: 'compass-compass',
      HADRON_PRODUCT_NAME: 'MongoDB Compass My Awesome Edition',
      HADRON_READONLY: 'true',
      HADRON_ISOLATED: 'true',
      HADRON_APP_VERSION: '1.2.3'
    });

    const target = new Target(path.join(__dirname, 'fixtures', 'hadron-app'));

    expect(target).to.have.property('distribution', 'my-custom-distribution');
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
