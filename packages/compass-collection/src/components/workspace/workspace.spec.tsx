import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { spy } from 'sinon';
import type AppRegistry from 'hadron-app-registry';

import { Workspace } from './workspace';

// TODO: why was this skipped?
describe.skip('Workspace [Component]', function () {
  const tabs = [{ isActive: true }, { isActive: false }];

  let prevTabSpy;
  let nextTabSpy;

  beforeEach(function () {
    prevTabSpy = spy();
    nextTabSpy = spy();

    render(
      <Workspace
        // @ts-expect-error there is way too many errors in this file but also
        // these tests are skipped so I'm just expecting error here for now
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
});
