import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';

import { AITextInput } from './ai-text-input';
import { configureStore } from '../../stores/query-bar-store';
import { changeAIPromptText } from '../../stores/ai-query-reducer';

const noop = () => {
  /* no op */
};

const renderAITextInput = ({
  ...props
}: Partial<ComponentProps<typeof AITextInput>> = {}) => {
  const store = configureStore();

  render(
    <Provider store={store}>
      <AITextInput onClose={noop} show {...props} />
    </Provider>
  );
  return store;
};

describe('QueryBar Component', function () {
  let store: ReturnType<typeof configureStore>;
  let onCloseSpy: SinonSpy;
  beforeEach(function () {
    onCloseSpy = sinon.spy();
  });
  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      store = renderAITextInput({
        onClose: onCloseSpy,
      });
    });

    it('calls to close robot button is clicked', function () {
      expect(onCloseSpy.called).to.be.false;
      const closeButton = screen.getByTestId('close-ai-query-button');
      expect(closeButton).to.be.visible;
      closeButton.click();
      expect(onCloseSpy.calledOnce).to.be.true;
    });
  });

  describe('when rendered with text', function () {
    beforeEach(function () {
      store = renderAITextInput({
        onClose: onCloseSpy,
      });
      store.dispatch(changeAIPromptText('test'));
    });

    it('calls to clear the text when the X is clicked', function () {
      expect(store.getState().aiQuery.aiPromptText).to.equal('test');

      const clearTextButton = screen.getByTestId('ai-text-clear-prompt');
      expect(clearTextButton).to.be.visible;
      clearTextButton.click();

      expect(store.getState().aiQuery.aiPromptText).to.equal('');
    });
  });
});
