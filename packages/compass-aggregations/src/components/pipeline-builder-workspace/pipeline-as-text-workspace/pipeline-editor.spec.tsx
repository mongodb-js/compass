import React from 'react';
import type { ComponentProps } from 'react';
import { screen, within } from '@mongodb-js/testing-library-compass';
import { MongoServerError } from 'mongodb';
import { expect } from 'chai';

import { renderWithStore } from '../../../../test/configure-store';

import { PipelineEditor } from './pipeline-editor';
import { PipelineParserError } from '../../../modules/pipeline-builder/pipeline-parser/utils';

const renderPipelineEditor = (
  props: Partial<ComponentProps<typeof PipelineEditor>> = {}
) => {
  return renderWithStore(
    <PipelineEditor
      namespace="test.test"
      pipelineText="[{$match: {}}]"
      syntaxErrors={[]}
      serverError={null}
      serverVersion="4.2"
      onChangePipelineText={() => {}}
      num_stages={1}
      {...props}
    />
  );
};

describe('PipelineEditor', function () {
  it('renders editor workspace', async function () {
    await renderPipelineEditor({});
    const container = screen.getByTestId('pipeline-as-text-editor');
    expect(container).to.exist;
  });

  it('renders server error', async function () {
    await renderPipelineEditor({
      serverError: new MongoServerError({ message: 'Can not use out' }),
    });
    const container = screen.getByTestId('pipeline-as-text-editor');
    expect(container).to.exist;

    expect(within(container).findByText(/Can not use out/)).to.exist;
  });

  it('renders syntax error', async function () {
    await renderPipelineEditor({
      syntaxErrors: [new PipelineParserError('invalid pipeline')],
    });
    const container = screen.getByTestId('pipeline-as-text-editor');
    expect(container).to.exist;

    expect(within(container).findByText(/invalid pipeline/)).to.exist;
  });
});
