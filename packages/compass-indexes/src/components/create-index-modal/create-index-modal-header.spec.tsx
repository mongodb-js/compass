import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import CreateIndexModalHeader from './create-index-modal-header';
import { expect } from 'chai';

describe('CreateIndexModalHeader', () => {
  it('renders the modal title', () => {
    render(<CreateIndexModalHeader />);
    const title = screen.getByTestId('create-index-modal-header-title');

    expect(title.textContent).to.be.equal('Create Index');
  });

  it('renders the subtitle text', () => {
    render(<CreateIndexModalHeader />);
    const subtitle = screen.getByTestId('create-index-modal-header-subtitle');
    expect(subtitle).to.exist;
  });

  it('renders the link to the Index Strategies Documentation', () => {
    render(<CreateIndexModalHeader />);
    const link = screen.getByRole('link', {
      name: /Index Strategies Documentation/i,
    });
    expect(link).to.exist;
  });
});
