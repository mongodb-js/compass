import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import IndexFlowSection from './index-flow-section';
import { expect } from 'chai';
import type { Field } from '../../modules/create-index';

describe('IndexFlowSection', () => {
  const renderComponent = ({
    createIndexFieldsComponent,
    fields,
  }: {
    createIndexFieldsComponent?: JSX.Element;
    fields?: Field[];
  }) => {
    render(
      <IndexFlowSection
        createIndexFieldsComponent={createIndexFieldsComponent ?? null}
        fields={fields || []}
        dbName={'fakeDBName'}
        collectionName={'fakeCollectionName'}
      />
    );
  };

  describe('when the fields are not filled in', () => {
    it('renders the Input Index header', () => {
      renderComponent({});
      expect(screen.getByText('Input Index')).to.be.visible;
    });

    it('does not render the Covered Queries header', () => {
      renderComponent({});
      expect(screen.queryByText('Covered Queries')).to.be.null;
    });

    it('renders the Code Equivalent toggle', () => {
      renderComponent({});
      expect(screen.getByLabelText('Toggle Code Equivalent')).to.be.visible;
    });

    it('renders the Show covered queries button and it\\s disabled', () => {
      renderComponent({});
      const coveredQueriesButton = screen.getByTestId(
        'index-flow-section-covered-queries-button'
      );

      expect(coveredQueriesButton).to.be.visible;
    });

    it('does not render the covered queries examples', () => {
      renderComponent({});
      expect(
        screen.queryByTestId('index-flow-section-covered-queries-examples')
      ).not.to.exist;
    });

    it('does not render the optimal query examples', () => {
      renderComponent({});
      expect(
        screen.queryByTestId('index-flow-section-optimal-queries-examples')
      ).not.to.exist;
    });

    it('renders the provided createIndexFieldsComponent', () => {
      const mockComponent = (
        <div data-testid="mock-component">Mock Component</div>
      );
      renderComponent({ createIndexFieldsComponent: mockComponent });
      expect(screen.getByTestId('mock-component')).to.be.visible;
    });
  });

  describe('when 3 index fields are filled in and user clicks on covered queries button', () => {
    const fields: Field[] = [
      { name: 'field1', type: '1 (asc)' },
      { name: 'field2', type: '-1 (desc)' },
      { name: 'field3', type: '1 (asc)' },
    ];

    beforeEach(() => {
      renderComponent({ fields });
      screen.getByTestId('index-flow-section-covered-queries-button').click();
    });

    it('renders the covered queries examples', () => {
      const coveredQueriesExamples = screen.getByTestId(
        'index-flow-section-covered-queries-examples'
      );
      expect(coveredQueriesExamples).to.exist;
      expect(coveredQueriesExamples).to.contain.text(
        JSON.stringify({
          field1: 1,
          field2: 2,
          field3: 3,
        })
      );
    });

    it('renders the optimal query examples', () => {
      const optimalQueriesExamples = screen.getByTestId(
        'index-flow-section-optimal-queries-examples'
      );
      expect(optimalQueriesExamples).to.exist;
      expect(optimalQueriesExamples).to.contain.text(
        `{"field1":1,"field2":{"$gt":2}}.sort(field3: 1})`
      );
    });

    it('renders the Learn More link', () => {
      const link = screen.getByText('Learn More');
      expect(link).to.be.visible;
    });
  });

  describe('when 2 index fields are filled in and user clicks on covered queries button', () => {
    const fields: Field[] = [
      { name: 'field1', type: '1 (asc)' },
      { name: 'field2', type: '1 (asc)' },
    ];

    beforeEach(() => {
      renderComponent({ fields });
      screen.getByTestId('index-flow-section-covered-queries-button').click();
    });

    it('renders the covered queries examples', () => {
      const coveredQueriesExamples = screen.getByTestId(
        'index-flow-section-covered-queries-examples'
      );
      expect(coveredQueriesExamples).to.exist;
    });

    it('renders the optimal query examples', () => {
      const optimalQueriesExamples = screen.getByTestId(
        'index-flow-section-optimal-queries-examples'
      );
      expect(optimalQueriesExamples).to.exist;
      expect(optimalQueriesExamples).to.contain.text(
        `{"field1":1,"field2":{"$gt":2}}}`
      );
      expect(optimalQueriesExamples).to.contain.text(
        `{"field1":1}.sort({"field2":2})`
      );
    });
  });

  describe('when 1 index field is filled in and user clicks on covered queries button', () => {
    const fields: Field[] = [{ name: 'field1', type: '1 (asc)' }];

    beforeEach(() => {
      renderComponent({ fields });
      screen.getByTestId('index-flow-section-covered-queries-button').click();
    });

    it('renders the covered queries examples', () => {
      expect(screen.getByTestId('index-flow-section-covered-queries-examples'))
        .to.exist;
    });

    it('does not render the optimal query examples', () => {
      expect(
        screen.queryByTestId('index-flow-section-optimal-queries-examples')
      ).not.to.exist;
    });
  });
});
