import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import IconBadge from './icon-badge';

describe('IconBadge Component', function () {
  afterEach(cleanup);

  it('should render the badge with icon', function () {
    render(<IconBadge text="hello" icon="Plus" />);
    expect(screen.getByText(/hello/i)).to.exist;
    expect(
      screen.getByRole('button', {
        name: /plus icon/i,
      })
    ).to.exist;
  });

  it('handles icon click', function () {
    const actionSpy = spy();
    render(<IconBadge text="Open Link" icon="Plus" onClick={actionSpy} />);
    expect(actionSpy.callCount).to.equal(0);
    userEvent.click(
      screen.getByRole('button', {
        name: /plus icon/i,
      })
    );
    expect(actionSpy.callCount).to.equal(1);
  });
});
