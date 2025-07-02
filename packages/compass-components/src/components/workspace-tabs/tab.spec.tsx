import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { Tab } from './tab';

describe('Tab', function () {
  let onCloseSpy: sinon.SinonSpy;
  let onSelectSpy: sinon.SinonSpy;
  let onDuplicateSpy: sinon.SinonSpy;
  let onCloseAllOthersSpy: sinon.SinonSpy;

  beforeEach(function () {
    onCloseSpy = sinon.spy();
    onSelectSpy = sinon.spy();
    onDuplicateSpy = sinon.spy();
    onCloseAllOthersSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered selected', function () {
    beforeEach(function () {
      render(
        <Tab
          type="Databases"
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          onDuplicate={onDuplicateSpy}
          onCloseAllOthers={onCloseAllOthersSpy}
          title="docs"
          isSelected
          isDragging={false}
          tabContentId="1"
          tooltip={[['Connection', 'ABC']]}
          iconGlyph="Folder"
        />
      );
    });

    it('should render the title', async function () {
      expect(await screen.findByText('docs')).to.be.visible;
    });

    it('should render the icon', async function () {
      expect(await screen.findByTestId('workspace-tab-icon-Folder')).to.be
        .visible;
    });

    it('should render the close tab button visible', async function () {
      expect(await screen.findByLabelText('Close Tab')).to.be.visible;
    });

    it('should call "onClose" when the close button is clicked', async function () {
      expect(onCloseSpy.callCount).to.equal(0);
      const closeTabButton = await screen.findByLabelText('Close Tab');
      closeTabButton.click();
      expect(onCloseSpy.callCount).to.equal(1);
    });

    it('should call "onSelect" when the tab is clicked', async function () {
      expect(onSelectSpy.callCount).to.equal(0);
      const tabContent = await screen.findByText('docs');
      tabContent.click();
      expect(onSelectSpy.callCount).to.equal(1);
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <Tab
          type="Databases"
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          onDuplicate={onDuplicateSpy}
          onCloseAllOthers={onCloseAllOthersSpy}
          title="docs"
          isSelected={false}
          isDragging={false}
          tabContentId="1"
          tooltip={[['Connection', 'ABC']]}
          iconGlyph="Folder"
        />
      );
    });

    it('should render the close tab button hidden', async function () {
      expect(
        getComputedStyle(await screen.findByLabelText('Close Tab'))
      ).to.have.property('display', 'none');
    });

    // not sure why this does not work
    it.skip('should render the close tab button visible when the tab is hovered', async function () {
      const tab = await screen.findByRole('tab');
      userEvent.hover(tab);
      expect(
        getComputedStyle(await screen.findByLabelText('Close Tab')).display
      ).to.not.equal('none');
    });
  });

  describe('when right-clicking', function () {
    beforeEach(function () {
      render(
        <Tab
          type="Databases"
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          onDuplicate={onDuplicateSpy}
          onCloseAllOthers={onCloseAllOthersSpy}
          title="docs"
          isSelected={false}
          isDragging={false}
          tabContentId="1"
          tooltip={[['Connection', 'ABC']]}
          iconGlyph="Folder"
        />
      );
    });

    describe('clicking menu items', function () {
      it('should propagate clicks on "Duplicate"', async function () {
        const tab = await screen.findByText('docs');
        userEvent.click(tab, { button: 2 });
        expect(screen.getByTestId('context-menu')).to.be.visible;

        const menuItem = await screen.findByText('Duplicate');
        menuItem.click();
        expect(onDuplicateSpy.callCount).to.equal(1);
        expect(onCloseAllOthersSpy.callCount).to.equal(0);
      });

      it('should propagate clicks on "Close all other tabs"', async function () {
        const tab = await screen.findByText('docs');
        userEvent.click(tab, { button: 2 });
        expect(screen.getByTestId('context-menu')).to.be.visible;

        const menuItem = await screen.findByText('Close all other tabs');
        menuItem.click();
        expect(onDuplicateSpy.callCount).to.equal(0);
        expect(onCloseAllOthersSpy.callCount).to.equal(1);
      });
    });
  });
});
