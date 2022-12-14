import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import sinon from 'sinon';
import { expect } from 'chai';

import { PipelineConfirmModal } from './pipeline-confirm-modal';

const renderPipelineConfirmModal = (
  props: Partial<ComponentProps<typeof PipelineConfirmModal>> = {}
) => {
  render(
    <PipelineConfirmModal
      isModalOpen={true}
      onConfirmNewPipeline={() => {}}
      onCloseModal={() => {}}
      {...props}
    />
  );
};

describe('PipelineConfirmModal [Component]', function() {
  it('renders correct text', function() {
    renderPipelineConfirmModal();
    expect(screen.findByText('Are you sure you want to create a new pipeline?')).to.exist;
    expect(screen.findByText('Creating this pipeline will abandon unsaved changes to the current pipeline.')).to.exist;
  });

  it('calls onCancel when clicking the cancel button', function() {
    const onCancelSpy = sinon.spy();
    renderPipelineConfirmModal({
      onCloseModal: onCancelSpy,
    });
    const modal = screen.getByTestId('confirm-new-pipeline-modal');
    expect(onCancelSpy.callCount).to.equal(0);

    userEvent.click(within(modal).getByText(/cancel/gi), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onCancelSpy.callCount).to.equal(1);
  });

  it('calls onConfirmNewPipeline when clicking the confirm button', function() {
    const onConfirmNewPipelineSpy = sinon.spy();
    renderPipelineConfirmModal({
      onConfirmNewPipeline: onConfirmNewPipelineSpy,
    });
    const modal = screen.getByTestId('confirm-new-pipeline-modal');
    expect(onConfirmNewPipelineSpy.callCount).to.equal(0);

    userEvent.click(within(modal).getByText(/confirm/gi), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onConfirmNewPipelineSpy.callCount).to.equal(1);
  });
});
