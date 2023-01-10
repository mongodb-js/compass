import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import sinon from 'sinon';

import configureStore from '../../stores/store';
import { FocusMode } from './focus-mode';

const renderFocusMode = (
  props: Partial<ComponentProps<typeof FocusMode>> = {},
) => {
  render(
    <Provider store={configureStore({
      sourcePipeline: [{$match: {_id: 1}}, {$limit: 10}, {$out: 'out'}]
    })}>
      <FocusMode
        isModalOpen={true}
        stageIndex={-1}
        stageOperator={null}
        stageInput={null}
        stageOutput={null}
        onCloseModal={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('FocusMode', function () {
  it('does not show modal when closed', function () {
    renderFocusMode({ isModalOpen: false });
    expect(() => {
      screen.getByTestId('focus-mode-modal')
    }).to.throw;
  });

  it('shows modal when open', function () {
    renderFocusMode({ isModalOpen: true, stageIndex: 0 });
    expect(screen.getByTestId('focus-mode-modal')).to.exist;
  });

  it('calls onCloseModal when close button is clicked', function () {
    const onCloseModal = sinon.spy();
    renderFocusMode({ onCloseModal, isModalOpen: true, stageIndex: 0 });

    expect(onCloseModal).to.not.have.been.called;
    screen.getByLabelText(/close modal/i).click();
    expect(onCloseModal).to.have.been.calledOnce;
  });

  it('renders stage input', function () {
    renderFocusMode({
      isModalOpen: true,
      stageIndex: 0,
      stageInput: {
        isLoading: false,
        documents: [{_id: 12345}, {_id: 54321}]
      }
    });

    const stageInput = screen.getByTestId('stage-input');

    expect(stageInput).to.exist;
    expect(within(stageInput).getByText(/stage input/i)).to.exist;
    expect(within(stageInput).getByText(/12345/i)).to.exist;
    expect(within(stageInput).getByText(/54321/i)).to.exist;
  });

  it('renders stage editor', function () {
    renderFocusMode({
      isModalOpen: true,
      stageIndex: 0,
      stageOperator: '$match'
    });

    const stageEditor = screen.getByTestId('stage-editor');

    expect(stageEditor).to.exist;
    expect(within(stageEditor).getByText(/open docs/i)).to.exist;
    expect(
      within(stageEditor).getByTestId('stage-operator-combobox')
    ).to.exist;
  });

  it('renders stage output', function () {
    renderFocusMode({
      isModalOpen: true,
      stageIndex: 0,
      stageOutput: {
        isLoading: false,
        documents: [{_id: 12345}, {_id: 54321}]
      }
    });

    const stageOutput = screen.getByTestId('stage-output');

    expect(stageOutput).to.exist;
    expect(within(stageOutput).getByText(/stage output/i)).to.exist;
    expect(within(stageOutput).getByText(/12345/i)).to.exist;
    expect(within(stageOutput).getByText(/54321/i)).to.exist;
  });
});