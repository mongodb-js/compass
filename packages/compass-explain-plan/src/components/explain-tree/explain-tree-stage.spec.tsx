import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import { ExplainTreeStage } from './explain-tree-stage';

describe('ExplainStage [Component]', function () {
  let component: ReturnType<typeof render>;
  const name = '';
  const nReturned = 1;
  const highlights = {};
  const curStageExecTimeMS = 2;
  const prevStageExecTimeMS = 1;
  const totalExecTimeMS = 3;
  const isShard = false;
  const details = {};

  beforeEach(function () {
    component = render(
      <ExplainTreeStage
        name={name}
        nReturned={nReturned}
        highlights={highlights}
        curStageExecTimeMS={curStageExecTimeMS}
        prevStageExecTimeMS={prevStageExecTimeMS}
        totalExecTimeMS={totalExecTimeMS}
        isShard={isShard}
        details={details}
        onToggleDetailsClick={() => {}}
        detailsOpen={false}
      />
    );
  });

  afterEach(cleanup);

  it('renders', function () {
    expect(component.getByTestId('explain-stage')).to.exist;
  });
});
