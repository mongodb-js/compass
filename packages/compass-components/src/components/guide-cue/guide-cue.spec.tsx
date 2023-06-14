import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen, cleanup, within } from '@testing-library/react';
import { Icon, IconButton, Button } from '../..';
import { GuideCue } from './guide-cue';

const renderGuideCue = (
  props: Partial<ComponentProps<typeof GuideCue>>,
  content?: string
) => {
  // Wrapping GuideCue component in this way as it is easier to test for
  // outside clicks.
  render(
    <div>
      <Button data-testid="outside-component">
        Outside Guide Cue Component
      </Button>
      <GuideCue
        cueId=""
        title=""
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
      >
        {content}
      </GuideCue>
    </div>
  );

  expect(screen.getByTestId('guide-cue-trigger')).to.exist;
};

const getGuideCuePopover = () => {
  // By default GC is rendered in a dialog and only one GC
  // should be visible to the user. So we are not using any
  // special selector here to narrow the list.
  return screen.getByRole('dialog');
};

describe('GuideCue', function () {
  afterEach(function () {
    cleanup();
    // todo: clean this
    localStorage.clear();
  });

  context('guide cue component', function () {
    it('renders a guide cue', function () {
      renderGuideCue(
        { title: 'Login with Atlas', cueId: 'gc' },
        'Now you can login with your atlas account'
      );

      const popover = getGuideCuePopover();
      expect(within(popover).getByText(/login with atlas/i)).to.exist;
      expect(
        within(popover).getByText(/now you can login with your atlas account/i)
      ).to.exist;
    });

    it('hides guide cue when action button is clicked', function () {
      renderGuideCue(
        { title: 'Login with Atlas', cueId: 'gc' },
        'Now you can login with your atlas account'
      );

      const popover = getGuideCuePopover();

      const actionButton = within(popover).getByRole('button', {
        name: /got it/i,
      });
      expect(actionButton).to.exist;
      actionButton.click();
      expect(() => getGuideCuePopover()).to.throw;
    });

    it('hides guide cue when user clicks outside guide cue popover', function () {
      renderGuideCue(
        { title: 'Login with Atlas', cueId: 'gc' },
        'Now you can login with your atlas account'
      );

      const popover = getGuideCuePopover();
      expect(popover).to.exist;

      const outsideButton = screen.getByTestId('outside-component');
      outsideButton.click();
      expect(() => getGuideCuePopover()).to.throw;
    });

    it('does not hide guide cue when user clicks inside guide cue popover', function () {
      renderGuideCue(
        { title: 'Login with Atlas', cueId: 'gc' },
        'Now you can login with your atlas account'
      );

      const popover = getGuideCuePopover();
      expect(popover).to.exist;

      within(popover)
        .getByText(/login with atlas/i)
        .click();
      expect(getGuideCuePopover()).to.exist;

      within(popover)
        .getByText(/now you can login with your atlas account/i)
        .click();
      expect(getGuideCuePopover()).to.exist;
    });
  });
});
