import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignalPopover } from './signal-popover';
import { expect } from 'chai';

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
  });
});
