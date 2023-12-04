import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { Tab } from './tab';

describe('Tab', function () {
  let onCloseSpy: sinon.SinonSpy;
  let onSelectSpy: sinon.SinonSpy;

  beforeEach(function () {
    onCloseSpy = sinon.spy();
    onSelectSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered selected', function () {
    beforeEach(function () {
      render(
        <Tab
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          title="docs"
          isSelected
          tabContentId="1"
          subtitle="test.collection"
          iconGlyph="Folder"
        />
      );
    });

    it('should render the subtitle', async function () {
      expect(await screen.findByText('test.collection')).to.be.visible;
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
      const tabContent = await screen.findByText('test.collection');
      tabContent.click();
      expect(onSelectSpy.callCount).to.equal(1);
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <Tab
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          title="docs"
          isSelected={false}
          tabContentId="1"
          subtitle="test.collection"
          iconGlyph="Folder"
        />
      );
    });

    it('should render the close tab button hidden', async function () {
      expect(await screen.findByLabelText('Close Tab')).to.not.be.visible;
    });

    // Focus visible is not working proper in jsdom environment
    it.skip('should render the close tab button visible when the tab is focused', async function () {
      const tabToFocus = await screen.findByRole('tab');
      tabToFocus.focus();
      expect(await screen.findByLabelText('Close Tab')).to.be.visible;
    });
  });
});
