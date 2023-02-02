import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';

import ExplainTree from '.';

describe('ExplainTree [Component]', function () {
  beforeEach(function () {
    render(
      <ExplainTree
        executionStats={{
          executionSuccess: true,
          nReturned: 0,
          executionTimeMillis: 100,
          totalKeysExamined: 100,
          totalDocsExamined: 100,
          executionStages: { stage: 'IXSCAN' } as any,
          allPlansExecution: [],
        }}
      />
    );
  });

  it('renders', function () {
    expect(screen.getByTestId('explain-tree')).to.exist;
  });
});
