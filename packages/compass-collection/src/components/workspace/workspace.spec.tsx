import { expect } from 'chai';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { Workspace } from './workspace';

function createTab(id: string) {
  return {
    id,
    namespace: id,
    type: 'collection',
    selectedSubTabName: 'Documents',
    localAppRegistry: {} as any,
    component: <div>Tab {id} content</div>,
  };
}

function renderWorkspace(
  props: Partial<React.ComponentProps<typeof Workspace>> = {}
) {
  return render(
    <Workspace
      tabs={[createTab('a'), createTab('b'), createTab('c')]}
      activeTabId="a"
      onSelectTab={() => {
        /** noop */
      }}
      onSelectNextTab={() => {
        /** noop */
      }}
      onSelectPreviousTab={() => {
        /** noop */
      }}
      onMoveTab={() => {
        /** noop */
      }}
      onCloseTab={() => {
        /** noop */
      }}
      onCreateNewTab={() => {
        /** noop */
      }}
      {...props}
    ></Workspace>
  );
}

describe('Workspace', function () {
  afterEach(cleanup);

  it('renders the tabs', function () {
    renderWorkspace();
    expect(screen.getByTitle('a - Documents')).to.exist;
    expect(screen.getByTitle('b - Documents')).to.exist;
    expect(screen.getByTitle('c - Documents')).to.exist;
    expect(screen.getByText('Tab a content')).to.exist;
  });
});
