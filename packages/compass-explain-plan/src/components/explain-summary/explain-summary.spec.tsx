import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import ExplainSummary from './explain-summary';

describe('ExplainSummary [Component]', function () {
  const nReturned = 0;
  const totalKeysExamined = 0;
  const totalDocsExamined = 0;
  const executionTimeMillis = 0;
  const inMemorySort = false;
  const indexType = 'UNAVAILABLE';

  beforeEach(function () {
    render(
      <ExplainSummary
        nReturned={nReturned}
        totalKeysExamined={totalKeysExamined}
        totalDocsExamined={totalDocsExamined}
        executionTimeMillis={executionTimeMillis}
        inMemorySort={inMemorySort}
        indexType={indexType}
        index={undefined}
      />
    );
  });

  it('renders', function () {
    expect(screen.getByTestId('explain-summary')).to.exist;
  });
});
