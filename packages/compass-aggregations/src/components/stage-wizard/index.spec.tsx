import React from 'react';
import type { ComponentProps } from 'react';
import { StageWizard } from './index';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import * as StageWizardUseCases from '../aggregation-side-panel/stage-wizard-use-cases';

const renderStageWizard = (
  props: Partial<ComponentProps<typeof StageWizard>> = {}
) => {
  return render(
    <StageWizard
      onApply={() => {}}
      onCancel={() => {}}
      onChange={() => {}}
      syntaxError={null}
      value={null}
      useCaseId="test"
      index={0}
      setNodeRef={() => {}}
      style={{}}
      listeners={undefined}
      fields={[]}
      {...props}
    />
  );
};

describe('stage wizard card', function () {
  before(function () {
    sinon.stub(StageWizardUseCases, 'STAGE_WIZARD_USE_CASES').value([
      {
        id: 'test',
        title: 'Test stage wizard',
        stageOperator: '$testStage',
        // eslint-disable-next-line react/display-name
        wizardComponent: () => <div>The unknown form element</div>,
      },
    ]);
  });

  after(function () {
    sinon.restore();
  });

  it('renders the use case title', function () {
    renderStageWizard();
    expect(screen.getByText(/test stage wizard/i)).to.exist;
  });

  it('renders the use case stage operator', function () {
    renderStageWizard();
    expect(screen.getByText(/\$teststage/i)).to.exist;
  });

  it('renders the use case wizard component', function () {
    renderStageWizard();
    expect(screen.getByText(/the unknown form element/i)).to.exist;
  });

  it('calls onCancel when cancel button is clicked', function () {
    const onCancel = sinon.spy();
    renderStageWizard({ onCancel });
    screen
      .getByRole('button', {
        name: /cancel/i,
      })
      .click();
    expect(onCancel).to.have.been.calledOnce;
  });

  it('calls onApply when apply button is clicked', function () {
    const onApply = sinon.spy();
    renderStageWizard({ onApply, value: '{}' });

    screen
      .getByRole('button', {
        name: /apply/i,
      })
      .click();
    expect(onApply).to.have.been.calledOnce;
  });
});
