import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import ConfirmationModal from './';

describe('App', () => {
  beforeEach(function() {
    render(
      <ConfirmationModal
        title="modal title"
        buttonText="ok"
      >
        <div
          role="testing-inner-content"
        >
          inner content
        </div>
      </ConfirmationModal>
    );
  });

  it('should show the modal heading', () => {
    expect(screen.getByRole('heading')).toHaveTextContent('modal title');
    expect(screen.getByRole('button')).toHaveTextContent('ok')
  });

  it('should show the modal button', () => {
    expect(screen.getByRole('button')).toHaveTextContent('ok');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('should show the modal content', () => {
    expect(screen.getByRole('testing-inner-content')).toHaveTextContent('inner content')
  });
});
