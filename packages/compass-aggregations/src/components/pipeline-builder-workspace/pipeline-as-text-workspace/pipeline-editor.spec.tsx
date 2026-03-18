import React from 'react';
import type { ComponentProps } from 'react';
import { screen, within, cleanup } from '@mongodb-js/testing-library-compass';
import { MongoServerError } from 'mongodb';
import { expect } from 'chai';
import sinon from 'sinon';

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
      searchIndexes={[]}
      onChangePipelineText={() => {}}
      onViewSearchIndexesClick={() => {}}
      onCreateSearchIndexClick={() => {}}
      onEditSearchIndexClick={() => {}}
      num_stages={1}
      {...props}
    />
  );
};

describe('PipelineEditor', function () {
  afterEach(cleanup);

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

  describe('search index banners', function () {
    describe('SearchIndexDoesNotExistBanner', function () {
      it('should show search index does not exist banner for $search stage', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "nonexistent" } }]',
          searchIndexes: [],
        });

        expect(screen.getByText(/Search index doesn't exist/i)).to.exist;
        expect(screen.getByText('View Search Indexes')).to.exist;
        expect(screen.getByText('Create a New Index')).to.exist;
      });

      it('should show search index does not exist banner for $vectorSearch stage', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $vectorSearch: { index: "nonexistent" } }]',
          searchIndexes: [],
        });

        expect(screen.getByText(/Vector search index doesn't exist/i)).to.exist;
        expect(screen.getByText('View Search Indexes')).to.exist;
        expect(screen.getByText('Create a New Index')).to.exist;
      });

      it('should NOT show search index does not exist banner when index exists', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "existing-index" } }]',
          searchIndexes: [{ name: 'existing-index' } as any],
        });

        expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
      });

      it('should NOT show search index does not exist banner for non-search stages', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $match: { _id: 1 } }]',
          searchIndexes: [],
        });

        expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
      });

      it('should prioritize serverError over searchIndexDoesNotExist', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "nonexistent" } }]',
          searchIndexes: [],
          serverError: new MongoServerError({ message: 'Server error' }),
        });

        expect(screen.getByTestId('pipeline-editor-error-message')).to.exist;
        expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
      });

      it('should prioritize syntaxError over searchIndexDoesNotExist', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "nonexistent" } }]',
          searchIndexes: [],
          syntaxErrors: [new PipelineParserError('Syntax error')],
        });

        expect(screen.getByTestId('pipeline-editor-syntax-error')).to.exist;
        expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
      });
    });

    describe('ServerErrorBanner with search index edit link', function () {
      it('should show edit link for search index definition errors', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "test-index" } }]',
          serverError: new MongoServerError({
            message:
              "geoWithin requires path 'location' to be indexed as 'geo'",
          }),
        });

        expect(screen.getByTestId('pipeline-editor-error-message')).to.exist;
        expect(screen.getByText('Edit Search Index')).to.exist;
      });

      it('should NOT show edit link for non-definition server errors', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "test-index" } }]',
          serverError: new MongoServerError({
            message: 'Connection timeout',
          }),
        });

        expect(screen.getByTestId('pipeline-editor-error-message')).to.exist;
        expect(screen.queryByText('Edit Search Index')).to.not.exist;
      });

      it('should NOT show edit link when no search index name found', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $match: { _id: 1 } }]',
          serverError: new MongoServerError({
            message:
              "geoWithin requires path 'location' to be indexed as 'geo'",
          }),
        });

        expect(screen.getByTestId('pipeline-editor-error-message')).to.exist;
        expect(screen.queryByText('Edit Search Index')).to.not.exist;
      });

      it('should call onEditSearchIndexClick when edit link is clicked', async function () {
        const onEditSearchIndexClick = sinon.spy();
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "test-index" } }]',
          serverError: new MongoServerError({
            message: "autocomplete requires path 'title' to be indexed",
          }),
          onEditSearchIndexClick,
        });

        const editLink = screen.getByText('Edit Search Index');
        editLink.click();

        expect(onEditSearchIndexClick.calledOnce).to.be.true;
        expect(onEditSearchIndexClick.calledWith('test-index')).to.be.true;
      });
    });
  });
});
