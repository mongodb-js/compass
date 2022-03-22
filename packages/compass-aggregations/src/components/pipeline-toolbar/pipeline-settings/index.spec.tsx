import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';

import configureStore from '../../../stores/store';
import { PipelineSettings } from '.';

describe('PipelineSettings', function () {
  let container: HTMLElement;
  let onExportToLanguageSpy: SinonSpy;
  beforeEach(function () {
    onExportToLanguageSpy = spy();
    render(
      <Provider store={configureStore()}>
        <PipelineSettings onExportToLanguage={onExportToLanguageSpy} />
      </Provider>
    );
    container = screen.getByTestId('pipeline-settings');
  });

  it('open export to language button', function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-export-button'
    );
    expect(button).to.exist;

    userEvent.click(button);

    expect(onExportToLanguageSpy.calledOnce).to.be.true;
    expect(onExportToLanguageSpy.firstCall.args).to.be.empty;
  });
});
