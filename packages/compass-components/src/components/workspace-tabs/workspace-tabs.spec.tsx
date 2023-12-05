import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';

import { WorkspaceTabs } from './workspace-tabs';
import type { TabProps } from './workspace-tabs';

function mockTab(tabId: number): TabProps {
  return {
    title: `mock-tab-${tabId}`,
    subtitle: `Documents - ${tabId}`,
    id: `${tabId}-content`,
    iconGlyph: 'Folder',
  };
}

describe('WorkspaceTabs', function () {
  let onCreateNewTabSpy: sinon.SinonSpy;
  let onCloseTabSpy: sinon.SinonSpy;
  let onSelectSpy: sinon.SinonSpy;
  let onSelectNextSpy: sinon.SinonSpy;
  let onSelectPrevSpy: sinon.SinonSpy;
  let onMoveTabSpy: sinon.SinonSpy;

  beforeEach(function () {
    onCreateNewTabSpy = sinon.spy();
    onCloseTabSpy = sinon.spy();
    onSelectSpy = sinon.spy();
    onSelectNextSpy = sinon.spy();
    onSelectPrevSpy = sinon.spy();
    onMoveTabSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <WorkspaceTabs
          aria-label="Workspace Tabs"
          onCreateNewTab={onCreateNewTabSpy}
          onCloseTab={onCloseTabSpy}
          onSelectTab={onSelectSpy}
          onSelectNextTab={onSelectNextSpy}
          onSelectPrevTab={onSelectPrevSpy}
          onMoveTab={onMoveTabSpy}
          tabs={[]}
          selectedTabIndex={0}
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

  describe('when rendered with multiple tabs', function () {
    beforeEach(function () {
      render(
        <WorkspaceTabs
          aria-label="Workspace Tabs"
          onCreateNewTab={onCreateNewTabSpy}
          onCloseTab={onCloseTabSpy}
          onSelectTab={onSelectSpy}
          onMoveTab={onMoveTabSpy}
          tabs={[1, 2, 3].map((tabId) => mockTab(tabId))}
          selectedTabIndex={1}
        />
      );
    });

    it('should render all of the tab namespaces', function () {
      expect(screen.getByText('mock-tab-1')).to.be.visible;
      expect(screen.getByText('mock-tab-2')).to.be.visible;
      expect(screen.getByText('mock-tab-3')).to.be.visible;
    });

    it('should render all of the tab subtitles', function () {
      expect(screen.getByText('Documents - 1')).to.be.visible;
      expect(screen.getByText('Documents - 2')).to.be.visible;
      expect(screen.getByText('Documents - 3')).to.be.visible;
    });

    it('should render the active tab aria-selected', function () {
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0].getAttribute('aria-selected')).to.equal('false');
      expect(tabs[1].getAttribute('aria-selected')).to.equal('true');
      expect(tabs[2].getAttribute('aria-selected')).to.equal('false');
    });

    describe('when the tab is focused and the left arrow is clicked', function () {
      it('should call to select the previous tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[1];
        tabElement.focus();
        userEvent.keyboard('{arrowleft}');
        expect(onSelectSpy).to.be.calledOnceWith(0);
      });
    });

    describe('when the tab is focused and the right arrow is clicked', function () {
      it('should call to select the next tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[1];
        tabElement.focus();
        userEvent.keyboard('{arrowright}');
        expect(onSelectSpy).to.be.calledOnceWith(2);
      });
    });

    describe('when the tab is focused and the home key is clicked', function () {
      it('should call to select the first tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[1];
        tabElement.focus();
        userEvent.keyboard('{home}');
        expect(onSelectSpy).to.be.calledOnceWith(0);
      });
    });

    describe('when the tablist is focused and the end key is clicked', function () {
      it('should call to select the last tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[1];
        tabElement.focus();
        userEvent.keyboard('{end}');
        expect(onSelectSpy).to.be.calledOnceWith(2);
      });
    });
  });

  describe('when the first tab is selected', function () {
    beforeEach(function () {
      render(
        <WorkspaceTabs
          aria-label="Workspace Tabs"
          onCreateNewTab={onCreateNewTabSpy}
          onCloseTab={onCloseTabSpy}
          onSelectTab={onSelectSpy}
          onMoveTab={onMoveTabSpy}
          tabs={[1, 2].map((tabId) => mockTab(tabId))}
          selectedTabIndex={0}
        />
      );
    });

    describe('when the tablist is focused and the left arrow is clicked', function () {
      it('should not call to select a no existant tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[0];
        tabElement.focus();
        userEvent.keyboard('{arrowleft}');
        expect(onSelectSpy.callCount).to.equal(0);
      });
    });
  });

  describe('when the last tab is selected', function () {
    beforeEach(function () {
      render(
        <WorkspaceTabs
          aria-label="Workspace Tabs"
          onCreateNewTab={onCreateNewTabSpy}
          onCloseTab={onCloseTabSpy}
          onSelectTab={onSelectSpy}
          onMoveTab={onMoveTabSpy}
          tabs={[1, 2].map((tabId) => mockTab(tabId))}
          selectedTabIndex={1}
        />
      );
    });

    describe('when the tablist is focused and the right arrow is clicked', function () {
      it('should not call to select a no existant tab', function () {
        expect(onSelectSpy.callCount).to.equal(0);
        const tabElement = screen.getAllByRole('tab')[1];
        tabElement.focus();
        userEvent.keyboard('{arrowright}');
        expect(onSelectSpy.callCount).to.equal(0);
      });
    });
  });
});
