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

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <Tab
          onClose={onCloseSpy}
          onSelect={onSelectSpy}
          activeSubTabName="docs"
          isSelected
          isFocused
          tabId="1"
          type="collection"
          namespace="test.collection"
          isTabListFocused
        />
      );
    });

    it('should render the namespace', async function () {
      expect(await screen.findByText('test.collection')).to.be.visible;
    });

    it('should render the activeSubTabName', async function () {
      expect(await screen.findByText('docs')).to.be.visible;
    });

    it('should render a close tab button', async function () {
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
});
