import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { WorkspaceTabs, getTabType } from './workspace-tabs';

describe('WorkspaceTabs', function () {
  let onCreateNewTabSpy: sinon.SinonSpy;
  let onCloseTabSpy: sinon.SinonSpy;
  let onSelectSpy: sinon.SinonSpy;

  beforeEach(function () {
    onCreateNewTabSpy = sinon.spy();
    onCloseTabSpy = sinon.spy();
    onSelectSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <WorkspaceTabs
          onCreateNewTab={onCreateNewTabSpy}
          onCloseTab={onCloseTabSpy}
          onSelectTab={onSelectSpy}
          tabs={[]}
        />
      );
    });

    it('should render a create new tab button', async function () {
      expect(await screen.findByLabelText('Create new tab')).to.be.visible;
    });

    it('should call to create a new tab when the create new tab button is clicked', async function () {
      expect(onCreateNewTabSpy.callCount).to.equal(0);

      const newTabButton = await screen.findByLabelText('Create new tab');
      newTabButton.click();

      expect(onCreateNewTabSpy.callCount).to.equal(1);
    });
  });

  describe('#getTabType', function () {
    it('should return "timeseries" for a timeseries collection', function () {
      expect(
        getTabType({
          isTimeSeries: true,
          isReadonly: false,
        })
      ).to.equal('timeseries');
    });

    it('should return "view" for a view', function () {
      expect(
        getTabType({
          isTimeSeries: false,
          isReadonly: true,
        })
      ).to.equal('view');
    });

    it('should return "collection" when its not time series or readonly', function () {
      expect(
        getTabType({
          isTimeSeries: false,
          isReadonly: false,
        })
      ).to.equal('collection');
    });
  });
});
