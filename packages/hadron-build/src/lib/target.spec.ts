import path from 'path';
import { expect } from 'chai';
import Target from './target';

describe('target', function () {
  let env: NodeJS.ProcessEnv;

  beforeEach(function () {
    env = { ...process.env };
  });

  afterEach(function () {
    process.env = { ...env };
  });

  it('should have autoupdate endpoint resolved from the package.json config', function () {
    const target = new Target(path.join(__dirname, '..', '..', 'test', 'fixtures', 'hadron-app'));

    expect(target).to.have.property(
      'autoUpdateBaseUrl',
      'https://hadron-app.herokuapp.com'
    );
  });

  it('defaults to package.json distribution config options', function () {
    const target = new Target(path.join(__dirname, '..', '..', 'test', 'fixtures', 'hadron-app'));

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

  it('allows to override distribution config with env vars', function () {
    Object.assign(process.env, {
      HADRON_DISTRIBUTION: 'compass-isolated',
      HADRON_PRODUCT: 'compass-compass',
      HADRON_PRODUCT_NAME: 'MongoDB Compass My Awesome Edition',
      HADRON_READONLY: 'true',
      HADRON_ISOLATED: 'true',
      HADRON_APP_VERSION: '1.2.3',
    });

    const target = new Target(path.join(__dirname, '..', '..', 'test', 'fixtures', 'hadron-app'));

    expect(target).to.have.property('distribution', 'compass-isolated');
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
