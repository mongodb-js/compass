import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests } from '../helpers/compass';
import type { Compass } from '../helpers/compass';

const connectionsWithNoSearchSupport = [
  {
    name: 'Local Connection',
    formOptions: {},
  },
  {
    name: 'Atlas Free Cluster',
    formOptions: {},
  },
];
const connectionsWithSearchSupport = [
  {
    name: 'Atlas Dedicated Cluster',
    formOptions: {},
  },
];

describe.only('Search Indexes', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests({
      extraSpawnArgs: ['--enableAtlasSearchIndexManagement'],
    });
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  for (const { name, formOptions } of connectionsWithNoSearchSupport) {
    context(`does not support search indexes in ${name}`, function () {
      beforeEach(function () {
        console.log(formOptions);
        // Connect
      });
      afterEach(function () {
        // Disconnect
      });
      it('allows users to create a regular index');
      it('renders search indexes tab disabled and shows tooltip');
    });
  }

  for (const { name, formOptions } of connectionsWithSearchSupport) {
    context(`supports search indexes in ${name}`, function () {
      beforeEach(function () {
        console.log(formOptions);
        // Connect
      });
      afterEach(function () {
        // Disconnect
      });
      it('allows users to create a regular indexes from dropdown');
      it('allows users to create a search indexes from dropdown');

      it('renders search indexes list');
      it('edits a search index');
      it('drops a search index');
      it('runs a search aggregation with index name');
    });
  }
});
