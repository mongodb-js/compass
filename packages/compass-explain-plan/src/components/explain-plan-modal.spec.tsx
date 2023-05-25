import React from 'react';
import { expect } from 'chai';
import { cleanup, screen, render as _render } from '@testing-library/react';
import type { ExplainPlanModalProps } from './explain-plan-modal';
import { ExplainPlanModal } from './explain-plan-modal';

function render(props: Partial<ExplainPlanModalProps>) {
  return _render(
    <ExplainPlanModal
      isModalOpen={true}
      onModalClose={() => {}}
      {...props}
    ></ExplainPlanModal>
  );
}

describe('ExplainPlanModal', function () {
  afterEach(cleanup);

  it('should render loading state', function () {
    render({ status: 'loading' });
    expect(screen.findByText('Running explain')).to.exist;
  });

  it('should render error state', function () {
    render({ status: 'error', error: 'Whoops, error!' });
    expect(screen.findByText('Whoops, error!')).to.exist;
  });

  it('should render ready state', function () {
    render({
      status: 'ready',
    });
    expect(screen.getByText('Query Performance Summary')).to.exist;
  });
});
