import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('redirects', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  // on a collection tab
  it('redirects to Collections if on the collection being removed and there are other collections in that database');
  it('redirects to Databases if on the collection being removed and it was the only collection in that database');
  it('does nothing if on a different collection to the one being removed');
  it('redirects to Databases if on a collection for the database being removed');
  it('does nothing if on a collection for a different database being removed');

  // on the Collections list
  it('does nothing if on Collections list containing the collection being removed and there are other collections in that database');
  it('redirects to Databases if on Collections list containing the collection being removed and it was the only collection in the database');
  it('redirects to Databases if on Collections list for the database being removed.');
  it('does nothing if on Collections list for a different database to the one being removed');

  // on any other part of the app
  it('does nothing if on Databases and a collection gets removed');
  it('does nothing if on Databases and a database gets removed');
  it('does nothing if on My Queries and a collection gets removed');
  it('does nothing if on My Queries and a database gets removed');
  it('does nothing if on Performance and a database gets removed');
  it('does nothing if on Performance and a collection gets removed');
});