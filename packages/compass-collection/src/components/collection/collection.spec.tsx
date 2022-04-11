import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { spy } from 'sinon';

import Collection from '../collection';
import { INITIAL_STATE as STATS_INITIAL_STATE } from '../../modules/stats';

describe('Collection [Component]', function () {
  let changeSubTabSpy;
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  const selectOrCreateTabSpy = spy();
  const sourceReadonly = false;

  beforeEach(function () {
    changeSubTabSpy = spy();
    render(
      <Collection
        isReadonly={false}
        isTimeSeries={false}
        sourceName={null}
        tabs={[]}
        views={[]}
        queryHistoryIndexes={[]}
        globalAppRegistry={globalAppRegistry}
        scopedModals={[]}
        localAppRegistry={localAppRegistry}
        activeSubTab={0}
        changeActiveSubTab={changeSubTabSpy}
        id="collection"
        namespace="db.coll"
        selectOrCreateTab={selectOrCreateTabSpy}
        sourceReadonly={sourceReadonly}
        pipeline={[]}
        stats={STATS_INITIAL_STATE}
      />
    );
  });

  afterEach(function () {
    changeSubTabSpy = null;
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('collection')).to.exist;
  });

  it('must not show the view icon', function () {
    expect(screen.queryByTestId('collection-badge-view')).to.not.exist;
  });

  it('must not include the collection name the view is based on', function () {
    expect(screen.queryByTestId('collection-view-on')).to.not.exist;
  });
});
