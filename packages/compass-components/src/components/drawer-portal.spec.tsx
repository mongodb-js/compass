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
  useDrawerState,
  useDrawerActions,
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
  // this produces a ton of warnings in the logs if they are not unique
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

  it('closes drawer when opened section is removed from toolbar data', async function () {
    // Render two sections, auto-open first one
    const { rerender } = render(
      <DrawerContentProvider>
        <DrawerAnchor>
          <DrawerSection
            id="test-section-1"
            label="Test section 1"
            title="Test section 1"
            glyph="Trash"
            autoOpen
          >
            This is a test section
          </DrawerSection>
          <DrawerSection
            id="test-section-2"
            label="Test section 2"
            title="Test section 2"
            glyph="Bell"
          >
            This is another test section
          </DrawerSection>
        </DrawerAnchor>
      </DrawerContentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('This is a test section')).to.be.visible;
    });

    // Now render without opened section
    rerender(
      <DrawerContentProvider>
        <DrawerAnchor>
          <DrawerSection
            id="test-section-2"
            label="Test section 2"
            title="Test section 2"
            glyph="Bell"
          >
            This is another test section
          </DrawerSection>
        </DrawerAnchor>
      </DrawerContentProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('This is a test section')).not.to.exist;
    });

    expect(
      // Specifically a selector for the drawer content section, not the whole
      // drawer with toolbar
      screen.getByTestId('lg-drawer')
    ).to.have.attribute('aria-hidden', 'true');
  });

  it('can control drawer state via the hooks', async function () {
    const ControlElement = () => {
      const { isDrawerOpen } = useDrawerState();
      const { openDrawer, closeDrawer } = useDrawerActions();
      return (
        <div>
          <span data-testid="drawer-state">
            {isDrawerOpen ? 'open' : 'closed'}
          </span>
          <button
            data-testid="toggle-drawer"
            onClick={
              isDrawerOpen
                ? () => closeDrawer()
                : () => openDrawer('controlled-section')
            }
          >
            {isDrawerOpen ? 'Hook Close drawer' : 'Hook Open drawer'}
          </button>
        </div>
      );
    };
    render(
      <DrawerContentProvider>
        <ControlElement />
        <DrawerAnchor>
          <DrawerSection
            id="unrelated-section"
            label="Test section 1"
            title="Test section 1"
            glyph="Trash"
          >
            This is an unrelated section
          </DrawerSection>
          <DrawerSection
            id="controlled-section"
            label="Test section 2"
            title="Test section 2"
            glyph="Bell"
          >
            This is the controlled section
          </DrawerSection>
        </DrawerAnchor>
      </DrawerContentProvider>
    );

    // Drawer is closed by default
    expect(screen.getByTestId('drawer-state')).to.have.text('closed');

    // Open the drawer
    userEvent.click(screen.getByRole('button', { name: 'Hook Open drawer' }));
    await waitFor(() => {
      expect(screen.getByTestId('drawer-state')).to.have.text('open');
      expect(screen.getByText('This is the controlled section')).to.be.visible;
    });

    // Close the drawer
    userEvent.click(screen.getByRole('button', { name: 'Hook Close drawer' }));
    await waitFor(() => {
      expect(screen.getByTestId('drawer-state')).to.have.text('closed');
      expect(screen.queryByText('This is the controlled section')).not.to.exist;
    });
  });

  it('renders guide cue when passed in props', async function () {
    function TestDrawer() {
      return (
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title={`Test section`}
              glyph="Trash"
              guideCue={{
                cueId: 'test-drawer',
                title: 'Introducing this new test drawer',
                description: 'Does all the things',
                buttonText: 'ok',
                tooltipAlign: 'bottom',
                tooltipJustify: 'end',
              }}
              autoOpen
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );
    }

    render(<TestDrawer></TestDrawer>);

    await waitFor(() => {
      expect(screen.getByText('Introducing this new test drawer')).to.be
        .visible;
    });
  });
});
