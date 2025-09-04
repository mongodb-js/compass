import React from 'react';
import {
  render,
  cleanup,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { SignalPopover, SignalHooksProvider } from './signal-popover';
import { expect } from 'chai';
import Sinon from 'sinon';

const signals = [
  {
    id: 'unbounded-array',
    title: 'Unbounded array detected',
    description:
      'As arrays get larger, queries and indexes on that array field become less efficient. Ensure your arrays are bounded to maintain optimal query performance.',
    learnMoreLink: 'https://example.com',
    primaryActionButtonLabel: 'Bound those arrays',
  },
  {
    id: 'bloated-docs',
    title: 'Possibly bloated documents',
    description:
      'Large documents can slow down queries by decreasing the number of documents that can be stored in RAM. Consider breaking up your data into more collections with smaller documents, and using references to consolidate the data you need.',
    learnMoreLink: 'https://example.com',
  },
];

describe('SignalPopover', function () {
  afterEach(cleanup);

  it('should render a signal', function () {
    render(<SignalPopover signals={signals[0]}></SignalPopover>);
    userEvent.click(screen.getByTestId('insight-badge-button'));
    expect(screen.getByText('Unbounded array detected')).to.exist;
  });

  it('should render multiple signals', function () {
    render(<SignalPopover signals={signals}></SignalPopover>);
    userEvent.click(screen.getByTestId('insight-badge-button'));
    expect(screen.getByText('Unbounded array detected')).to.exist;
    userEvent.click(screen.getByTitle('Show next insight'));
    expect(screen.getByText('Possibly bloated documents')).to.exist;

    it('and the badge should read 2 insights without the icon showing up', function () {
      expect(screen.getByText('2 insights')).to.exist;
      expect(screen.getByTestId('insight-badge-icon').style.opacity).to.equal(
        '0'
      );
    });
  });

  describe('onAssistantButtonClick functionality', function () {
    it('should show "Tell me more" button and hide standalone "Learn more" link when onAssistantButtonClick is provided', function () {
      const signalWithAssistant = {
        ...signals[0],
        onAssistantButtonClick: Sinon.spy(),
      };

      render(<SignalPopover signals={signalWithAssistant}></SignalPopover>);
      userEvent.click(screen.getByTestId('insight-badge-button'));

      expect(screen.getByTestId('tell-me-more-button')).to.exist;
      expect(screen.getByText('Tell me more')).to.exist;

      const learnMoreLinks = screen.getAllByTestId('insight-signal-link');
      expect(learnMoreLinks).to.have.length(1);
    });

    it('should show "Learn more" link and hide "Tell me more" button when onAssistantButtonClick is not provided', function () {
      render(<SignalPopover signals={signals[0]}></SignalPopover>);
      userEvent.click(screen.getByTestId('insight-badge-button'));

      expect(screen.getByTestId('insight-signal-link')).to.exist;
      expect(screen.getByText('Learn more')).to.exist;

      expect(() => screen.getByTestId('tell-me-more-button')).to.throw();
    });

    it('should call onAssistantButtonClick when "Tell me more" button is clicked', function () {
      const onAssistantButtonClick = Sinon.spy();
      const signalWithAssistant = {
        ...signals[0],
        onAssistantButtonClick,
      };

      render(<SignalPopover signals={signalWithAssistant}></SignalPopover>);
      userEvent.click(screen.getByTestId('insight-badge-button'));

      const tellMeMoreButton = screen.getByTestId('tell-me-more-button');
      userEvent.click(tellMeMoreButton);

      expect(onAssistantButtonClick).to.have.been.calledOnce;
    });
  });

  describe('SignalHooksProvider', function () {
    it('should call hooks through the signal lifecycle', function () {
      const hooks: React.ComponentProps<typeof SignalHooksProvider> = {
        onSignalMount: Sinon.spy(),
        onSignalOpen: Sinon.spy(),
        onSignalClose: Sinon.spy(),
        onSignalLinkClick: Sinon.spy(),
        onSignalPrimaryActionClick: Sinon.spy(),
      };

      render(
        <SignalHooksProvider {...hooks}>
          <SignalPopover signals={signals}></SignalPopover>
        </SignalHooksProvider>
      );

      userEvent.click(screen.getByTestId('insight-badge-button'));
      userEvent.click(screen.getByText('Bound those arrays'), undefined, {
        skipPointerEventsCheck: true,
      });
      userEvent.click(screen.getByTitle('Show next insight'));
      userEvent.click(screen.getByText('Learn more'));
      userEvent.click(screen.getByLabelText('Close'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(hooks.onSignalMount).to.have.been.calledTwice;
      expect(hooks.onSignalMount).to.have.been.calledWith('unbounded-array');
      expect(hooks.onSignalMount).to.have.been.calledWith('bloated-docs');
      expect(
        hooks.onSignalPrimaryActionClick
      ).to.have.been.calledOnceWithExactly('unbounded-array');
      expect(hooks.onSignalLinkClick).to.have.been.calledOnceWithExactly(
        'bloated-docs'
      );
      expect(hooks.onSignalClose).to.have.been.calledOnceWithExactly(
        'bloated-docs'
      );
    });
  });
});
