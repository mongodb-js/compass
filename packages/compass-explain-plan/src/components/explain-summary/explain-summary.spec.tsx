import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import ExplainSummary from './explain-summary';

describe('ExplainSummary [Component]', function () {
  const nReturned = 1;
  const totalKeysExamined = 2;
  const totalDocsExamined = 3;
  const executionTimeMillis = 4;
  const inMemorySort = true;
  const indexType = 'COVERED';
  const index = {
    fields: [
      { field: 'field1', value: 'value1' },
      { field: 'field2', value: 'value2' },
    ],
  };

  beforeEach(function () {
    render(
      <ExplainSummary
        nReturned={nReturned}
        totalKeysExamined={totalKeysExamined}
        totalDocsExamined={totalDocsExamined}
        executionTimeMillis={executionTimeMillis}
        inMemorySort={inMemorySort}
        indexType={indexType}
        index={index}
      />
    );
  });

  afterEach(cleanup);

  it('renders', function () {
    expect(screen.getByTestId('explain-summary')).to.exist;
  });

  it('renders the correct nReturned value', function () {
    expect(screen.getByTestId('nReturned-summary-label').textContent).to.equal(
      'Documents Returned:'
    );
    expect(screen.getByTestId('nReturned-summary-value').textContent).to.equal(
      '1'
    );
  });

  it('renders the correct totalKeysExamined value', function () {
    expect(
      screen.getByTestId('totalKeysExamined-summary-label').textContent
    ).to.equal('Index Keys Examined:');
    expect(
      screen.getByTestId('totalKeysExamined-summary-value').textContent
    ).to.equal('2');
  });

  it('renders the correct totalDocsExamined value', function () {
    expect(
      screen.getByTestId('totalDocsExamined-summary-label').textContent
    ).to.equal('Documents Examined:');
    expect(
      screen.getByTestId('totalDocsExamined-summary-value').textContent
    ).to.equal('3');
  });

  it('renders the correct executionTimeMillis value', function () {
    expect(
      screen.getByTestId('executionTimeMillis-summary-label').textContent
    ).to.equal('Actual Query Execution Time (ms):');
    expect(
      screen.getByTestId('executionTimeMillis-summary-value').textContent
    ).to.equal('4');
  });

  it('renders the correct inMemorySort value', function () {
    expect(
      screen.getByTestId('inMemorySort-summary-label').textContent
    ).to.equal('Sorted in Memory:');
    expect(
      screen.getByTestId('inMemorySort-summary-value').textContent
    ).to.equal('yes');
  });

  it('renders the correct indexType value', function () {
    expect(
      screen.getByTestId('summary-index-stat-message').textContent
    ).to.equal('Query covered by index:');
    expect(screen.getByTestId('summary-index-stat-badge').textContent).to.equal(
      'field1(value1)field2(value2)'
    );
  });
});
