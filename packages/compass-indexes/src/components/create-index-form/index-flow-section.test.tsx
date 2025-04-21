import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import IndexFlowSection from './index-flow-section';
import { expect } from 'chai';

describe('IndexFlowSection', () => {
  const renderComponent = (createIndexFieldsComponent?: JSX.Element) => {
    render(
      <IndexFlowSection
        createIndexFieldsComponent={createIndexFieldsComponent ?? null}
      />
    );
  };
  it('renders the Input Index header', () => {
    renderComponent();
    expect(screen.getByText('Input Index')).to.exist;
  });

  it('renders the Code Equivalent toggle', () => {
    renderComponent();
    expect(screen.getByLabelText('Toggle Code Equivalent')).to.exist;
  });

  it('renders the Show me covered queries button', () => {
    renderComponent();
    expect(screen.getByText('Show me covered queries')).to.exist;
  });

  it('renders the Covered Queries header', () => {
    renderComponent();
    expect(screen.getByText('Covered Queries')).to.exist;
  });

  it('renders the provided createIndexFieldsComponent', () => {
    const mockComponent = (
      <div data-testid="mock-component">Mock Component</div>
    );
    renderComponent(mockComponent);
    expect(screen.getByTestId('mock-component')).to.exist;
  });

  it('renders the covered queries examples', () => {
    renderComponent();
    expect(screen.getByTestId('index-flow-section-covered-queries-examples')).to
      .exist;
  });

  it('renders the optimal query examples', () => {
    renderComponent();
    expect(screen.getByTestId('index-flow-section-optimal-query-examples')).to
      .exist;
  });

  it('renders the Learn More link', () => {
    renderComponent();
    const link = screen.getByText('Learn More');
    expect(link).to.exist;
  });
});
