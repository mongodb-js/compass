import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { Modal } from './modal';

describe('Modal Component', function () {
  it('opens and closes', () => {
    const { rerender } = render(
      <Modal data-testid="modal" open={false}>
        <p data-testid="modal-content">The content!</p>
      </Modal>
    );

    expect(screen.getByTestId('modal')).to.be.closed;

    rerender(
      <Modal data-testid="modal" open={true}>
        <p data-testid="modal-content">The content!</p>
      </Modal>
    );

    expect(screen.getByTestId('modal')).to.be.open;
  });
});
