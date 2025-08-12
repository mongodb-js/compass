import React, { useState } from 'react';
import { render, screen, waitFor } from '@mongodb-js/testing-library-compass';
import {
  DrawerContentProvider,
  DrawerSection,
  DrawerAnchor,
} from './drawer-portal';
import { expect } from 'chai';

describe('DrawerSection', function () {
  it('renders DrawerSection in the portal and updates the content when it updates', async function () {
    let setCount;

    function TestDrawer() {
      const [count, _setCount] = useState(0);
      setCount = _setCount;
      return (
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title={`Test section: ${count}`}
              glyph="Trash"
              autoOpen
            >
              This is a test section and the count is {count}
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );
    }

    render(<TestDrawer></TestDrawer>);

    await waitFor(() => {
      expect(screen.getByText('Test section: 0')).to.be.visible;
      expect(screen.getByText('This is a test section and the count is 0')).to
        .be.visible;
    });

    setCount(42);

    await waitFor(() => {
      expect(screen.getByText('Test section: 42')).to.be.visible;
      expect(screen.getByText('This is a test section and the count is 42')).to
        .be.visible;
    });
  });
});
