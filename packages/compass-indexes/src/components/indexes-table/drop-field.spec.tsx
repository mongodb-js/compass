import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import DropField from './drop-field';

describe('DropField Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('renders delete button', function () {
    const onDeleteSpy = spy();
    render(<DropField name="artist_id_index" onDelete={onDeleteSpy} />);
    const button = screen.getByTestId('drop-index-button');
    expect(button).to.exist;
    expect(button.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDeleteSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onDeleteSpy.callCount).to.equal(1);
  });
});
