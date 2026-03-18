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
import sinon from 'sinon';

describe('DrawerSection', function () {
  it('renders DrawerSection in the portal and updates the content when it updates', async function () {
    let setCount: React.Dispatch<React.SetStateAction<number>> = () => {};

    function TestDrawer() {
      const [count, _setCount] = useState(0);
      // Exposed for testing purposes
      // eslint-disable-next-line react-hooks/globals
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
    const onDrawerSectionOpenSpy = sinon.spy();
    const onDrawerSectionHideSpy = sinon.spy();

    render(
      <DrawerContentProvider
        onDrawerSectionOpen={onDrawerSectionOpenSpy}
        onDrawerSectionHide={onDrawerSectionHideSpy}
      >
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

    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith('section-1');
    onDrawerSectionOpenSpy.resetHistory();

    userEvent.click(screen.getByRole('button', { name: 'Section 2' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 2')).to.be.visible;
    });

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith('section-1');
    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith('section-2');
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    userEvent.click(screen.getByRole('button', { name: 'Section 3' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 3')).to.be.visible;
    });

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith('section-2');
    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith('section-3');
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    userEvent.click(screen.getByRole('button', { name: 'Section 1' }));
    await waitFor(() => {
      expect(screen.getByText('This is section 1')).to.be.visible;
    });

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith('section-3');
    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith('section-1');
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => {
      expect(screen.queryByText('This is section 1')).not.to.exist;
      expect(screen.queryByText('This is section 2')).not.to.exist;
      expect(screen.queryByText('This is section 3')).not.to.exist;
    });

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith('section-1');
    expect(onDrawerSectionOpenSpy).to.not.have.been.called;
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();
  });

  it('closes drawer when opened section is removed from toolbar data', async function () {
    const onDrawerSectionOpenSpy = sinon.spy();
    const onDrawerSectionHideSpy = sinon.spy();

    // Render two sections, auto-open first one
    const { rerender } = render(
      <DrawerContentProvider
        onDrawerSectionOpen={onDrawerSectionOpenSpy}
        onDrawerSectionHide={onDrawerSectionHideSpy}
      >
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

    expect(onDrawerSectionHideSpy).to.not.have.been.called;
    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith(
      'test-section-1'
    );
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    // Now render without opened section
    rerender(
      <DrawerContentProvider
        onDrawerSectionOpen={onDrawerSectionOpenSpy}
        onDrawerSectionHide={onDrawerSectionHideSpy}
      >
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

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith(
      'test-section-1'
    );
    expect(onDrawerSectionOpenSpy).to.not.have.been.called;
  });

  it('can control drawer state via the hooks', async function () {
    const onDrawerSectionOpenSpy = sinon.spy();
    const onDrawerSectionHideSpy = sinon.spy();

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
      <DrawerContentProvider
        onDrawerSectionOpen={onDrawerSectionOpenSpy}
        onDrawerSectionHide={onDrawerSectionHideSpy}
      >
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

    expect(onDrawerSectionHideSpy).to.not.have.been.called;
    expect(onDrawerSectionOpenSpy).to.not.have.been.called;
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    // Open the drawer
    userEvent.click(screen.getByRole('button', { name: 'Hook Open drawer' }));
    await waitFor(() => {
      expect(screen.getByTestId('drawer-state')).to.have.text('open');
      expect(screen.getByText('This is the controlled section')).to.be.visible;
    });

    expect(onDrawerSectionHideSpy).to.not.have.been.called;
    expect(onDrawerSectionOpenSpy).to.have.been.calledOnceWith(
      'controlled-section'
    );
    onDrawerSectionOpenSpy.resetHistory();
    onDrawerSectionHideSpy.resetHistory();

    // Close the drawer
    userEvent.click(screen.getByRole('button', { name: 'Hook Close drawer' }));
    await waitFor(() => {
      expect(screen.getByTestId('drawer-state')).to.have.text('closed');
      expect(screen.queryByText('This is the controlled section')).not.to.exist;
    });

    expect(onDrawerSectionHideSpy).to.have.been.calledOnceWith(
      'controlled-section'
    );
    expect(onDrawerSectionOpenSpy).to.not.have.been.called;
  });

  it('renders guide cue when passed in props', async function () {
    localStorage.compass_guide_cues = '[]';
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

  describe('beforeSectionHide', function () {
    it('prevents drawer from closing when beforeSectionHide resolves to false', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(false);

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close the drawer
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));

      // Callback should have been called
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Drawer should still be open
      expect(screen.getByText('This is a test section')).to.be.visible;
    });

    it('allows drawer to close when beforeSectionHide resolves to true', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(true);

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close the drawer
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));

      // Callback should have been called and drawer should close
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('prevents switching to another section when beforeSectionHide resolves to false', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(false);

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch to section 2
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));

      // Callback should have been called
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Section 1 should still be visible (switch was prevented)
      expect(screen.getByText('This is section 1')).to.be.visible;
      expect(screen.queryByText('This is section 2')).not.to.exist;
    });

    it('allows switching to another section when beforeSectionHide resolves to true', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(true);

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch to section 2
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));

      // Callback should have been called and switch should happen
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });

    it('prevents programmatic closeDrawer when beforeSectionHide resolves to false', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(false);

      const ControlElement = () => {
        const { closeDrawer } = useDrawerActions();
        return (
          <button data-testid="close-btn" onClick={() => closeDrawer()}>
            Close programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close programmatically
      userEvent.click(screen.getByTestId('close-btn'));

      // Callback should have been called
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Drawer should still be open
      expect(screen.getByText('This is a test section')).to.be.visible;
    });

    it('allows programmatic closeDrawer when beforeSectionHide resolves to true', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(true);

      const ControlElement = () => {
        const { closeDrawer } = useDrawerActions();
        return (
          <button data-testid="close-btn" onClick={() => closeDrawer()}>
            Close programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close programmatically
      userEvent.click(screen.getByTestId('close-btn'));

      // Callback should have been called and drawer should close
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('prevents programmatic openDrawer to different section when beforeSectionHide resolves to false', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(false);

      const ControlElement = () => {
        const { openDrawer } = useDrawerActions();
        return (
          <button
            data-testid="switch-btn"
            onClick={() => openDrawer('section-2')}
          >
            Switch programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch programmatically
      userEvent.click(screen.getByTestId('switch-btn'));

      // Callback should have been called
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Section 1 should still be visible (switch was prevented)
      expect(screen.getByText('This is section 1')).to.be.visible;
      expect(screen.queryByText('This is section 2')).not.to.exist;
    });

    it('allows programmatic openDrawer to different section when beforeSectionHide resolves to true', async function () {
      const beforeSectionHideSpy = sinon.stub().resolves(true);

      const ControlElement = () => {
        const { openDrawer } = useDrawerActions();
        return (
          <button
            data-testid="switch-btn"
            onClick={() => openDrawer('section-2')}
          >
            Switch programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch programmatically
      userEvent.click(screen.getByTestId('switch-btn'));

      // Callback should have been called and switch should happen
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });

    it('allows drawer to close when beforeSectionHide throws an error', async function () {
      const beforeSectionHideSpy = sinon
        .stub()
        .rejects(new Error('Test error'));

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close the drawer
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));

      // Callback should have been called and drawer should close (error is caught)
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('allows switching sections when beforeSectionHide throws an error', async function () {
      const beforeSectionHideSpy = sinon
        .stub()
        .rejects(new Error('Test error'));

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch to section 2
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));

      // Callback should have been called and switch should happen (error is caught)
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });

    it('allows programmatic closeDrawer when beforeSectionHide throws an error', async function () {
      const beforeSectionHideSpy = sinon
        .stub()
        .rejects(new Error('Test error'));

      const ControlElement = () => {
        const { closeDrawer } = useDrawerActions();
        return (
          <button data-testid="close-btn" onClick={() => closeDrawer()}>
            Close programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // Try to close programmatically
      userEvent.click(screen.getByTestId('close-btn'));

      // Callback should have been called and drawer should close (error is caught)
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('allows programmatic openDrawer when beforeSectionHide throws an error', async function () {
      const beforeSectionHideSpy = sinon
        .stub()
        .rejects(new Error('Test error'));

      const ControlElement = () => {
        const { openDrawer } = useDrawerActions();
        return (
          <button
            data-testid="switch-btn"
            onClick={() => openDrawer('section-2')}
          >
            Switch programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // Try to switch programmatically
      userEvent.click(screen.getByTestId('switch-btn'));

      // Callback should have been called and switch should happen (error is caught)
      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });

    it('prevents concurrent closeDrawer calls while beforeSectionHide is pending', async function () {
      let resolveCallback: (value: boolean) => void;
      const beforeSectionHideSpy = sinon
        .stub()
        .returns(new Promise((resolve) => (resolveCallback = resolve)));

      const ControlElement = () => {
        const { closeDrawer } = useDrawerActions();
        return (
          <button data-testid="close-btn" onClick={() => closeDrawer()}>
            Close programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // First close attempt
      userEvent.click(screen.getByTestId('close-btn'));

      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Second close attempt while first is still pending
      userEvent.click(screen.getByTestId('close-btn'));
      userEvent.click(screen.getByTestId('close-btn'));

      // Should still only be called once (concurrent calls are ignored)
      expect(beforeSectionHideSpy).to.have.been.calledOnce;

      // Resolve the first call
      resolveCallback!(true);

      await waitFor(() => {
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('prevents concurrent openDrawer calls while beforeSectionHide is pending', async function () {
      let resolveCallback: (value: boolean) => void;
      const beforeSectionHideSpy = sinon
        .stub()
        .returns(new Promise((resolve) => (resolveCallback = resolve)));

      const ControlElement = () => {
        const { openDrawer } = useDrawerActions();
        return (
          <button
            data-testid="switch-btn"
            onClick={() => openDrawer('section-2')}
          >
            Switch programmatically
          </button>
        );
      };

      render(
        <DrawerContentProvider>
          <ControlElement />
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // First switch attempt
      userEvent.click(screen.getByTestId('switch-btn'));

      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Second switch attempt while first is still pending
      userEvent.click(screen.getByTestId('switch-btn'));
      userEvent.click(screen.getByTestId('switch-btn'));

      // Should still only be called once (concurrent calls are ignored)
      expect(beforeSectionHideSpy).to.have.been.calledOnce;

      // Resolve the first call
      resolveCallback!(true);

      await waitFor(() => {
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });

    it('prevents concurrent clicks on close button while beforeSectionHide is pending', async function () {
      let resolveCallback: (value: boolean) => void;
      const beforeSectionHideSpy = sinon
        .stub()
        .returns(new Promise((resolve) => (resolveCallback = resolve)));

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="test-section"
              label="Test section"
              title="Test section"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is a test section
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is a test section')).to.be.visible;
      });

      // First click on close button
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));

      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Multiple rapid clicks while first is still pending
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
      userEvent.click(screen.getByRole('button', { name: 'Close drawer' }));

      // Should still only be called once (concurrent calls are ignored)
      expect(beforeSectionHideSpy).to.have.been.calledOnce;

      // Resolve the first call
      resolveCallback!(true);

      await waitFor(() => {
        expect(screen.queryByText('This is a test section')).not.to.exist;
      });
    });

    it('prevents concurrent clicks on toolbar buttons while beforeSectionHide is pending', async function () {
      let resolveCallback: (value: boolean) => void;
      const beforeSectionHideSpy = sinon
        .stub()
        .returns(new Promise((resolve) => (resolveCallback = resolve)));

      render(
        <DrawerContentProvider>
          <DrawerAnchor>
            <DrawerSection
              id="section-1"
              label="Section 1"
              title="Section 1"
              glyph="Trash"
              autoOpen
              beforeSectionHide={beforeSectionHideSpy}
            >
              This is section 1
            </DrawerSection>
            <DrawerSection
              id="section-2"
              label="Section 2"
              title="Section 2"
              glyph="Bell"
            >
              This is section 2
            </DrawerSection>
          </DrawerAnchor>
        </DrawerContentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('This is section 1')).to.be.visible;
      });

      // First click to switch sections
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));

      await waitFor(() => {
        expect(beforeSectionHideSpy).to.have.been.calledOnce;
      });

      // Multiple rapid clicks while first is still pending
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));
      userEvent.click(screen.getByRole('button', { name: 'Section 2' }));

      // Should still only be called once (concurrent calls are ignored)
      expect(beforeSectionHideSpy).to.have.been.calledOnce;

      // Resolve the first call
      resolveCallback!(true);

      await waitFor(() => {
        expect(screen.getByText('This is section 2')).to.be.visible;
      });

      expect(screen.queryByText('This is section 1')).not.to.exist;
    });
  });
});
