import React, { useState } from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
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

  // Doesn't really matter, but leafygreen uses these as keys when rendering and
  // this produces a ton of warnings in the logs
  const icons = ['ArrowDown', 'CaretDown', 'ChevronDown'] as const;

  it('switches drawer content when selecting a different section in the toolbar', async function () {
    render(
      <DrawerContentProvider>
        <DrawerAnchor>
          {[1, 2, 3].map((n, idx) => {
            return (
              <DrawerSection
                key={`section-${n}`}
                id={`section-${n}`}
                label={`Section ${n}`}
                title={`Section ${n}`}
                glyph={icons[idx]}
              >
                This is section {n}
              </DrawerSection>
            );
          })}
        </DrawerAnchor>
      </DrawerContentProvider>
    );

    userEvent.click(screen.getByRole('button', { name: 'Section 1' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 1')).to.be.visible;
    });

    userEvent.click(screen.getByRole('button', { name: 'Section 2' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 2')).to.be.visible;
    });

    userEvent.click(screen.getByRole('button', { name: 'Section 3' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 3')).to.be.visible;
    });

    userEvent.click(screen.getByRole('button', { name: 'Section 1' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 1')).to.be.visible;
    });

    userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => {
      expect(screen.queryByText('This is section 1')).not.to.exist;
      expect(screen.queryByText('This is section 2')).not.to.exist;
      expect(screen.queryByText('This is section 3')).not.to.exist;
    });
  });
});
