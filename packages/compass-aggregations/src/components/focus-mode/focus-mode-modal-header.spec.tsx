import type { ComponentProps } from 'react';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { FocusModeModalHeader } from './focus-mode-modal-header';
import Sinon from 'sinon';

function noop() {}

describe('FocusModeModalHeader', function () {
  let sandbox: Sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.reset();
    cleanup();
  });

  function renderFocusModeModalHeader(
    props: Partial<ComponentProps<typeof FocusModeModalHeader>> = {}
  ) {
    return render(
      <FocusModeModalHeader
        isEnabled
        stageIndex={0}
        stages={['$match', '$limit', '$project']}
        onAddStageClick={noop}
        onStageSelect={noop}
        onStageDisabledToggleClick={noop}
        {...props}
      ></FocusModeModalHeader>
    );
  }

  it('disables "previous stage" button when showing first stage', async function () {
    const context = renderFocusModeModalHeader();

    expect(
      await context.findByLabelText('Edit previous stage')
    ).to.have.attribute('disabled');
  });

  it('disables "next stage" button when showing last stage', async function () {
    const context = renderFocusModeModalHeader({ stageIndex: 2 });

    expect(await context.findByLabelText('Edit next stage')).to.have.attribute(
      'disabled'
    );
  });

  it('calls onAddStageClick with correct index when "Add stage before" clicked', async function () {
    const onAddStageClick = sandbox.spy();
    const context = renderFocusModeModalHeader({
      stageIndex: 1,
      onAddStageClick,
    });

    userEvent.click(await context.findByText('Add stage'), undefined, {
      skipPointerEventsCheck: true,
    });
    userEvent.click(await context.findByText('Add stage before'), undefined, {
      skipPointerEventsCheck: true,
    });

    expect(onAddStageClick).to.be.calledOnceWithExactly(0);
  });

  it('calls onAddStageClick with correct index when "Add stage after" clicked', async function () {
    const onAddStageClick = sandbox.spy();
    const context = renderFocusModeModalHeader({
      stageIndex: 1,
      onAddStageClick,
    });

    userEvent.click(await context.findByText('Add stage'), undefined, {
      skipPointerEventsCheck: true,
    });
    userEvent.click(await context.findByText('Add stage after'), undefined, {
      skipPointerEventsCheck: true,
    });

    expect(onAddStageClick).to.be.calledOnceWithExactly(1);
  });

  it('calls onStageSelect with correct index when "Edit previous stage" is clicked', async function () {
    const onStageSelect = sandbox.spy();
    const context = renderFocusModeModalHeader({
      stageIndex: 1,
      onStageSelect,
    });

    userEvent.click(
      await context.findByLabelText('Edit previous stage'),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );

    expect(onStageSelect).to.be.calledOnceWithExactly(0);
  });

  it('calls onStageSelect with correct index when "Edit next stage" is clicked', async function () {
    const onStageSelect = sandbox.spy();
    const context = renderFocusModeModalHeader({
      stageIndex: 1,
      onStageSelect,
    });

    userEvent.click(
      await context.findByLabelText('Edit next stage'),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );

    expect(onStageSelect).to.be.calledOnceWithExactly(2);
  });

  it('calls onStageDisabledToggleClick with { newDisabled: true } when clicked for enabled stage', async function () {
    const onStageDisabledToggleClick = sandbox.spy();
    const context = renderFocusModeModalHeader({
      onStageDisabledToggleClick,
    });

    userEvent.click(await context.findByLabelText('Disable stage'));

    expect(onStageDisabledToggleClick).to.be.calledOnceWithExactly(0, true);
  });

  it('calls onStageDisabledToggleClick with { newDisabled: false } when clicked for disabled stage', async function () {
    const onStageDisabledToggleClick = sandbox.spy();
    const context = renderFocusModeModalHeader({
      isEnabled: false,
      onStageDisabledToggleClick,
    });

    userEvent.click(await context.findByLabelText('Enable stage'));

    expect(onStageDisabledToggleClick).to.be.calledOnceWithExactly(0, false);
  });
});
