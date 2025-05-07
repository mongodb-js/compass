import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import CreateIndexOptionsAccordion from './create-index-options-accordion';

describe('CreateIndexOptionsAccordion', () => {
  it('renders the button with "Options" text', () => {
    render(
      <CreateIndexOptionsAccordion>Test Content</CreateIndexOptionsAccordion>
    );
    expect(screen.getByText('Options')).to.exist;
  });

  it('toggles the accordion content when the button is clicked', () => {
    render(
      <CreateIndexOptionsAccordion>Test Content</CreateIndexOptionsAccordion>
    );

    const button = screen.getByRole('button', { name: /options/i });
    expect(screen.queryByText('Test Content')).to.not.exist;

    userEvent.click(button);
    expect(screen.getByText('Test Content')).to.exist;

    userEvent.click(button);
    expect(screen.queryByText('Test Content')).to.not.exist;
  });

  it('renders the correct icon based on the open state', () => {
    render(
      <CreateIndexOptionsAccordion>Test Content</CreateIndexOptionsAccordion>
    );

    const button = screen.getByRole('button', { name: /options/i });
    expect(
      screen.getByTestId('create-index-options-accordion-icon')
    ).to.have.attribute('aria-label', 'Chevron Right Icon');

    userEvent.click(button);
    expect(
      screen.getByTestId('create-index-options-accordion-icon')
    ).to.have.attribute('aria-label', 'Chevron Down Icon');
  });
});
