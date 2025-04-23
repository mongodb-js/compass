import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import QueryFlowSection from './query-flow-section';
import { expect } from 'chai';

describe('QueryFlowSection', () => {
  it('renders the input query section with placeholder text', () => {
    render(<QueryFlowSection />);
    const inputElement = screen.getByPlaceholderText(
      "Type a query: { field: 'value' }"
    );
    expect(inputElement).to.be.visible;
  });

  it('renders the "Show me suggested index" button', () => {
    render(<QueryFlowSection />);
    const buttonElement = screen.getByText('Show me suggested index');
    expect(buttonElement).to.be.visible;
  });

  it('renders the suggested index section with formatted index code', () => {
    render(<QueryFlowSection />);
    const codeElement = screen.getByTestId(
      'query-flow-section-suggested-index'
    );
    expect(codeElement).to.be.visible;
  });

  it('renders the link to the MongoDB documentation', () => {
    render(<QueryFlowSection />);
    const linkElement = screen.getByText('here');
    expect(linkElement).to.be.visible;
  });
});
