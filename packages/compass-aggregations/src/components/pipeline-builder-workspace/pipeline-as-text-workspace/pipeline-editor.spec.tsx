import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { MongoServerError } from 'mongodb';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../stores/store';

import { PipelineEditor } from './pipeline-editor';

const renderPipelineEditor = (
  props: Partial<ComponentProps<typeof PipelineEditor>> = {}
) => {
  render(
    <Provider store={configureStore({})}>
      <PipelineEditor
        pipelineText="[{$match: {}}]"
        syntaxErrors={[]}
        serverError={null}
        serverVersion="4.2"
        fields={[]}
        onChangePipelineText={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('PipelineEditor', function () {
  it('renders editor workspace', function () {
    renderPipelineEditor({});
    const container = screen.getByTestId('pipeline-as-text-editor');
    expect(container).to.exist;
  });

  it('renders server error', function () {
    renderPipelineEditor({
      serverError: new MongoServerError({ message: 'Can not use out' }),
    });
    const container = screen.getByTestId('pipeline-as-text-editor');
    expect(container).to.exist;

    expect(within(container).findByText(/Can not use out/)).to.exist;
  });
});
