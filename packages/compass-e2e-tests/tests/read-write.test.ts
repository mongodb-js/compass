import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
} from '../helpers/compass';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import type { Compass } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';

describe('readWrite: true', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let connId: string;

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('readWrite', false);
    await browser.setupDefaultConnections();
    await createNumbersCollection('numbers', 1000, true);
    await browser.connectToDefaults();
    connId = await browser.getConnectionIdByName(getDefaultConnectionNames(0));
  });

  afterEach(async function () {
    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
      await browser.setFeature('readWrite', false);
      await cleanup(compass);
    }
  });

  describe('in sidebar navigation', function () {
    it('should hide delete / rename controls for databases and collections, modify for views', async function () {
      await browser.setFeature('readWrite', true);

      const dbItem = browser.$(Selectors.sidebarDatabase(connId, 'test'));

      // Expand database list
      await browser.clickVisible(dbItem);

      const collItem = browser.$(
        Selectors.sidebarCollection(connId, 'test', 'numbers')
      );
      const viewItem = browser.$(
        Selectors.sidebarCollection(connId, 'test', 'numbers_view')
      );

      // Wait for collections to load
      await Promise.all([
        collItem.waitForDisplayed(),
        viewItem.waitForDisplayed(),
      ]);

      // Check that drop db action is not available
      expect(await dbItem.$('aria/Drop database').isExisting()).to.eq(
        false,
        'Expected "Drop database" button to NOT exist'
      );

      // For collections only "open in" action is left, so "Show actions"
      // shouldn't be displayed
      await browser.clickVisible(collItem);
      expect(await collItem.$('aria/Show actions').isExisting()).to.eq(
        false,
        'Expected extended actions menu for collection to NOT exist (all items are hidden)'
      );

      await browser.clickVisible(viewItem);
      await browser.clickVisible(viewItem.$('aria/Show actions'));
      await viewItem.$('[role=menu]').waitForStable();

      // For views you should still be able to duplicate them
      await viewItem.$('aria/Duplicate view').waitForDisplayed({
        timeoutMsg: 'Expected "Duplicate view" action item to exist',
      });

      // ... but everything else is not available
      expect(await viewItem.$('aria/Drop view').isExisting()).to.eq(
        false,
        'Expected "Drop view" action item to NOT exist'
      );
      expect(await viewItem.$('aria/Modify view').isExisting()).to.eq(
        false,
        'Expected "Modify view" action item to NOT exist'
      );
    });
  });

  describe('in view workspace', function () {
    it('should hide "Edit Pipeline" button', async function () {
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers_view',
        'Documents'
      );

      // Should exist before we switch the option
      await browser.$('aria/Edit Pipeline').waitForDisplayed({
        timeoutMsg: 'Expected "Edit Pipeline" action item to exist',
      });

      void browser.setFeature('readWrite', true);

      // Should be hidden after that
      await browser.$('aria/Edit Pipeline').waitForExist({
        reverse: true,
        timeoutMsg: 'Expected "Edit Pipeline" action item to NOT exist',
      });
    });
  });

  describe('in Indexes collection sub tab', function () {
    it('should hide "Create Index" controls', async function () {
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Indexes'
      );

      let createIndexButtonLabel = 'Create';

      // Should exist before we switch the option
      try {
        await browser.$(`aria/${createIndexButtonLabel}`).waitForDisplayed({
          timeout: 10_000,
          timeoutMsg: 'Expected "Create" button to exist',
        });
      } catch {
        createIndexButtonLabel = 'Create Index';
        await browser.$(`aria/${createIndexButtonLabel}`).waitForDisplayed({
          timeoutMsg: 'Expected "Create" or "Create Index" button to exist',
        });
      }

      void browser.setFeature('readWrite', true);

      // Should be hidden after that
      await browser.$(`aria/${createIndexButtonLabel}`).waitForExist({
        reverse: true,
        timeoutMsg: `Expected "${createIndexButtonLabel}" button to NOT exist`,
      });
    });
  });

  describe('when "no index" insight is displayed', function () {
    it('should not show the Create Index button on Documents page', async function () {
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Documents'
      );
      await browser.runFindOperation('Documents', '{ i: 1 }', {
        waitForResult: true,
      });

      await browser.$(Selectors.InsightIconButton).waitForDisplayed();
      await browser.clickVisible(Selectors.InsightIconButton);
      await browser.$('aria/Create index').waitForDisplayed({
        timeoutMsg: 'Expected "Create index" action button to exist',
      });

      void browser.setFeature('readWrite', true);

      await browser.$('aria/Create index').waitForDisplayed({
        reverse: true,
        timeoutMsg: 'Expected "Create index" action button to NOT exist',
      });
    });

    it('should not show the Create Index button on Aggregations page', async function () {
      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Aggregations'
      );
      await browser.clickVisible(Selectors.AddStageButton);
      await browser.selectStageOperator(0, '$match');
      await browser.setCodemirrorEditorValue(
        Selectors.stageEditor(0),
        '{ i: 1 }'
      );

      await browser.$(Selectors.InsightIconButton).waitForDisplayed();
      await browser.clickVisible(Selectors.InsightIconButton);
      await browser.$('aria/Create index').waitForDisplayed({
        timeoutMsg: 'Expected "Create index" action button to exist',
      });

      void browser.setFeature('readWrite', true);

      await browser.$('aria/Create index').waitForDisplayed({
        reverse: true,
        timeoutMsg: 'Expected "Create index" action button to NOT exist',
      });
    });
  });
});
