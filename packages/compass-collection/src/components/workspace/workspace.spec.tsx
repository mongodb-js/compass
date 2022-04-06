import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { spy } from 'sinon';
import type AppRegistry from 'hadron-app-registry';

import { Workspace, getTabType } from './workspace';

describe.skip('Workspace [Component]', function () {
  const tabs = [{ isActive: true }, { isActive: false }];

  let prevTabSpy;
  let nextTabSpy;

  beforeEach(function () {
    prevTabSpy = spy();
    nextTabSpy = spy();

    render(
      <Workspace
        tabs={tabs}
        closeTab={() => ({
          type: 'type',
          index: 1,
        })}
        moveTab={() => ({
          type: 'type',
          fromIndex: 1,
          toIndex: 2,
        })}
        selectTab={() => ({
          type: 'type',
          index: 1,
        })}
        appRegistry={{} as AppRegistry}
        prevTab={prevTabSpy}
        nextTab={nextTabSpy}
        selectOrCreateTab={() => {}}
        changeActiveSubTab={() => ({
          type: 'type',
          activeSubTab: 1,
          id: '123',
        })}
        createNewTab={() => {}}
      />
    );
  });

  afterEach(function () {
    prevTabSpy = null;
    nextTabSpy = null;
  });

  it('renders the tab div', function () {
    expect(screen.getByTestId('workspace-tabs')).to.exist;
  });

  // TODO: finish this test
  it.skip('renders one tab hidden, one not', function () {
    // New part:
    // const workspaceViewTabs = screen.queryByTestId('collection-badge-view');
    // Old part:
    // expect(component.find(`.${styles['workspace-view-tab']}:not(.hidden)`)).to.be.present();
    // expect(component.find(`.${styles['workspace-view-tab']}.hidden`)).to.be.present();
  });

  describe('#getTabType', function () {
    it('should return "timeseries" for a timeseries collection', function () {
      expect(getTabType(true, false)).to.equal('timeseries');
    });

    it('should return "view" for a view', function () {
      expect(getTabType(false, true)).to.equal('view');
    });

    it('should return "collection" when its not time series or readonly', function () {
      expect(getTabType(false, false)).to.equal('collection');
    });
  });
});
