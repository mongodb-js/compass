import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import sinon from 'sinon';

import configureStore from '../../stores/store';
import { FocusMode } from './focus-mode';

const renderFocusMode = (
  props: Partial<ComponentProps<typeof FocusMode>> = {}
) => {
  render(
    <Provider
      store={configureStore({
        sourcePipeline: [
          { $match: { _id: 1 } },
          { $limit: 10 },
          { $out: 'out' },
        ],
      })}
    >
      <FocusMode
        isModalOpen={true}
        isAutoPreviewEnabled={true}
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
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });

  it('shows modal when open', function () {
    renderFocusMode({ isModalOpen: true });
    expect(screen.getByTestId('focus-mode-modal')).to.exist;
  });

  it('calls onCloseModal when close button is clicked', function () {
    const onCloseModal = sinon.spy();
    renderFocusMode({ onCloseModal, isModalOpen: true });

    expect(onCloseModal).to.not.have.been.called;
    screen.getByLabelText(/close modal/i).click();
    expect(onCloseModal).to.have.been.calledOnce;
  });
});
