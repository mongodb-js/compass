import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Icon, IconButton, Button } from '../..';
import * as GuideCueGroups from './guide-cue-groups';
import { GuideCue } from './guide-cue';
import Sinon from 'sinon';

const renderGuideCue = (props: Partial<ComponentProps<typeof GuideCue>>) => {
  const containerRef = React.createRef<any>();
  // Wrapping GuideCue component in this way as it is easier to test for
  // outside clicks.
  render(
    <div ref={containerRef}>
      <Button data-testid="outside-component">
        Outside Guide Cue Component
      </Button>
      <GuideCue
        cueId=""
        title=""
        description=""
        trigger={({ ref }) => (
          <IconButton
            data-testid="guide-cue-trigger"
            ref={ref}
            aria-labelledby="Guide Cue Trigger"
          >
            <Icon glyph={'Code'} size="small"></Icon>
          </IconButton>
        )}
        {...props}
      />
    </div>
  );

  expect(within(containerRef.current).getByTestId('guide-cue-trigger')).to
    .exist;
};

const getGuideCuePopover = () => {
  // By default GC is rendered in a dialog and only one GC
  // should be visible to the user. So we are not using any
  // special selector here to narrow the list.
  return screen.getByRole('dialog');
};

const GROUP_STEPS_MAP = new Map([
  ['group-one', 1],
  ['group-two', 2],
]);

describe('GuideCue', function () {
  const sandbox = Sinon.createSandbox();

  before(function () {
    sandbox.replace(GuideCueGroups, 'GROUP_STEPS_MAP', GROUP_STEPS_MAP);
  });

  after(function () {
    cleanup();
    sandbox.restore();
  });

  afterEach(function () {
    localStorage.clear();
  });

  context('guide cue component', function () {
    it('renders a guide cue', async function () {
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());
      const popover = getGuideCuePopover();
      expect(within(popover).getByText(/login with atlas/i)).to.exist;
      expect(
        within(popover).getByText(/now you can login with your atlas account/i)
      ).to.exist;
    });

    it('hides guide cue when action button is clicked', async function () {
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());

      const popover = getGuideCuePopover();
      userEvent.click(
        within(popover).getByRole('button', {
          name: /got it/i,
        })
      );

      await waitForElementToBeRemoved(() => getGuideCuePopover());

      expect(() => getGuideCuePopover()).to.throw;
    });

    it('hides guide cue when user clicks outside guide cue popover', async function () {
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());

      const outsideButton = screen.getByTestId('outside-component');
      userEvent.click(outsideButton);

      await waitForElementToBeRemoved(() => getGuideCuePopover());
      expect(() => getGuideCuePopover()).to.throw;
    });

    it('does not hide guide cue when user clicks inside guide cue popover', async function () {
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());

      const popover = getGuideCuePopover();

      userEvent.click(within(popover).getByText(/login with atlas/i));
      expect(getGuideCuePopover()).to.exist;

      userEvent.click(
        within(popover).getByText(/now you can login with your atlas account/i)
      );
      expect(getGuideCuePopover()).to.exist;
    });

    it('calls onPrimaryButtonClick when button is primary action is clicked', async function () {
      const onPrimaryButtonClick = Sinon.spy();
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        onPrimaryButtonClick,
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());

      const popover = getGuideCuePopover();
      userEvent.click(
        within(popover).getByRole('button', {
          name: /got it/i,
        })
      );

      // LG GC uses 100ms timeout for calling onPrimaryButtonClick
      // Adding 100 more just to be safe
      await waitFor(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 200);
          })
      );

      expect(onPrimaryButtonClick.calledOnce).to.be.true;
    });

    it('calls onOpenChange when cue open state changes', async function () {
      const onOpenChange = Sinon.spy();
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'gc',
        onOpenChange,
        description: 'Now you can login with your atlas account',
      });

      await waitFor(() => getGuideCuePopover());

      expect(onOpenChange.calledOnce).to.be.true;
      expect(onOpenChange.firstCall.args[0]).to.be.true;

      const popover = getGuideCuePopover();
      userEvent.click(
        within(popover).getByRole('button', {
          name: /got it/i,
        })
      );

      expect(onOpenChange.calledTwice).to.be.true;
      expect(onOpenChange.secondCall.args[0]).to.be.false;
    });
  });

  context('list of cues', function () {
    it('renders cues when group is complete', async function () {
      // add first cue from the group
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'one',
        groupId: 'group-two',
        step: 1,
        description: 'Now you can login with your atlas account',
      });

      // when added GC is not visible as the group is not complete
      expect(() => getGuideCuePopover()).to.throw;

      // add second cue from the group
      renderGuideCue({
        title: 'Your Atlas connections',
        cueId: 'two',
        groupId: 'group-two',
        step: 2,
        description: 'These are your Atlas connections',
      });

      // wait for cue to show up
      await waitFor(() => getGuideCuePopover());

      const popover1 = within(getGuideCuePopover());
      expect(popover1.getByText('Login with Atlas')).to.exist;
      expect(
        popover1.getByText('Now you can login with your atlas account')
      ).to.exist;
      expect(popover1.getByText('1 of 2')).to.exist;

      // on next to cue 2
      userEvent.click(
        popover1.getByRole('button', {
          name: /next/i,
        })
      );

      // wait for current cue to be removed
      await waitForElementToBeRemoved(() => getGuideCuePopover());

      // wait for next cue to show up
      await waitFor(() => getGuideCuePopover());

      const popover2 = within(getGuideCuePopover());
      expect(popover2.getByText('Your Atlas connections')).to.exist;
      expect(popover2.getByText('These are your Atlas connections')).to.exist;
      expect(popover2.getByText('2 of 2')).to.exist;
      // on next to nothing
      userEvent.click(
        popover2.getByRole('button', {
          name: /got it/i,
        })
      );

      // wait for current cue to be removed
      await waitForElementToBeRemoved(() => getGuideCuePopover());

      expect(() => getGuideCuePopover()).to.throw;
    });

    it('calls onDismiss when dismiss action is clicked', async function () {
      const onDismiss = Sinon.spy();
      renderGuideCue({
        title: 'Login with Atlas',
        cueId: 'one',
        groupId: 'group-two',
        step: 1,
        onDismiss,
        description: 'Now you can login with your atlas account',
      });
      renderGuideCue({
        title: 'Your Atlas connections',
        cueId: 'two',
        groupId: 'group-two',
        step: 2,
        description: 'These are your Atlas connections',
      });

      // wait for cue to show up
      await waitFor(() => getGuideCuePopover());

      const popover = getGuideCuePopover();
      userEvent.click(
        within(popover).getByRole('button', {
          name: /close tooltip/i,
        })
      );

      // LG GC uses 400ms timeout for calling onDismiss
      // Adding 100 for extra safety.
      await waitFor(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 500);
          })
      );

      expect(onDismiss.calledOnce).to.be.true;
    });

    it('renders standalone cues', async function () {
      renderGuideCue({
        title: 'Connection Form',
        cueId: 'one',
        description: 'Favorite your connection here',
      });
      renderGuideCue({
        title: 'Connection List',
        cueId: 'two',
        description: 'All your connections are here - recent and favorite',
      });

      await waitFor(() => getGuideCuePopover());

      const popover1 = within(getGuideCuePopover());
      expect(popover1.getByText('Connection Form')).to.exist;
      expect(popover1.getByText('Favorite your connection here')).to.exist;

      // mark this cue as visited.
      userEvent.click(
        popover1.getByRole('button', {
          name: /got it/i,
        })
      );

      // wait for current cue to be removed
      await waitForElementToBeRemoved(() => getGuideCuePopover());

      // wait for next cue to show up
      await waitFor(() => getGuideCuePopover());

      const popover2 = within(getGuideCuePopover());
      expect(popover2.getByText('Connection List')).to.exist;
      expect(
        popover2.getByText(
          'All your connections are here - recent and favorite'
        )
      ).to.exist;
      userEvent.click(
        popover2.getByRole('button', {
          name: /got it/i,
        })
      );

      // wait for current cue to be removed
      await waitForElementToBeRemoved(() => getGuideCuePopover());

      expect(() => getGuideCuePopover()).to.throw;
    });
  });
});
