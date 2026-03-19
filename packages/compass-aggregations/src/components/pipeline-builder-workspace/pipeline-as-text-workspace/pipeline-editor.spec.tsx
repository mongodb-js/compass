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
  props: Partial<ComponentProps<typeof PipelineEditor>> = {},
  storeOptions: any = {}
) => {
  return renderWithStore(
    <PipelineEditor
      namespace="test.test"
      pipelineText="[{$match: {}}]"
      syntaxErrors={[]}
      serverError={null}
      serverVersion="4.2"
      searchIndexName={null}
      searchStageOperator={null}
      showSearchIndexDoesNotExistBanner={false}
      onChangePipelineText={() => {}}
      onViewSearchIndexesClick={() => {}}
      onCreateSearchIndexClick={() => {}}
      onEditSearchIndexClick={() => {}}
      num_stages={1}
      {...props}
    />,
    storeOptions
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
        await renderPipelineEditor(
          {
            pipelineText: '[{ $search: { index: "nonexistent" } }]',
            searchIndexName: 'nonexistent',
            searchStageOperator: '$search',
            showSearchIndexDoesNotExistBanner: true,
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.getByTestId('search-index-does-not-exist-banner')).to
          .exist;
        expect(screen.getByText('View Search Indexes')).to.exist;
        expect(screen.getByText('Create a New Index')).to.exist;
      });

      it('should show search index does not exist banner for $vectorSearch stage', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $vectorSearch: { index: "nonexistent" } }]',
            searchIndexName: 'nonexistent',
            searchStageOperator: '$vectorSearch',
            showSearchIndexDoesNotExistBanner: true,
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.getByTestId('search-index-does-not-exist-banner')).to
          .exist;
        expect(screen.getByText('View Search Indexes')).to.exist;
        expect(screen.getByText('Create a New Index')).to.exist;
      });

      it('should NOT show search index does not exist banner when index exists', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $search: { index: "existing-index" } }]',
            searchIndexName: 'existing-index',
            searchStageOperator: '$search',
            showSearchIndexDoesNotExistBanner: false,
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.queryByTestId('search-index-does-not-exist-banner')).to
          .not.exist;
      });

      it('should NOT show search index does not exist banner for non-search stages', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $match: { _id: 1 } }]',
            searchIndexName: null,
            searchStageOperator: null,
            showSearchIndexDoesNotExistBanner: false,
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.queryByTestId('search-index-does-not-exist-banner')).to
          .not.exist;
      });

      it('should prioritize serverError over searchIndexDoesNotExist', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $search: { index: "nonexistent" } }]',
            searchIndexName: 'nonexistent',
            searchStageOperator: '$search',
            showSearchIndexDoesNotExistBanner: true,
            serverError: new MongoServerError({ message: 'Server error' }),
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.getByTestId('pipeline-editor-error-message')).to.exist;
        expect(screen.queryByTestId('search-index-does-not-exist-banner')).to
          .not.exist;
      });

      it('should prioritize syntaxError over searchIndexDoesNotExist', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $search: { index: "nonexistent" } }]',
            searchIndexName: 'nonexistent',
            searchStageOperator: '$search',
            showSearchIndexDoesNotExistBanner: true,
            syntaxErrors: [new PipelineParserError('Syntax error')],
          },
          {
            preferences: {
              enableSearchActivationProgramP1: true,
            },
          }
        );

        expect(screen.getByTestId('pipeline-editor-syntax-error')).to.exist;
        expect(screen.queryByTestId('search-index-does-not-exist-banner')).to
          .not.exist;
      });

      it('should NOT show search index does not exist banner when feature flag is disabled', async function () {
        await renderPipelineEditor(
          {
            pipelineText: '[{ $search: { index: "nonexistent" } }]',
            searchIndexName: 'nonexistent',
            searchStageOperator: '$search',
            showSearchIndexDoesNotExistBanner: true,
          },
          {
            preferences: {
              enableSearchActivationProgramP1: false,
            },
          }
        );

        expect(screen.queryByTestId('search-index-does-not-exist-banner')).to
          .not.exist;
      });
    });

    describe('ServerErrorBanner with search index edit link', function () {
      it('should show edit link for search index definition errors', async function () {
        await renderPipelineEditor({
          pipelineText: '[{ $search: { index: "test-index" } }]',
          searchIndexName: 'test-index',
          searchStageOperator: '$search',
          showSearchIndexDoesNotExistBanner: false,
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
          searchIndexName: 'test-index',
          searchStageOperator: '$search',
          showSearchIndexDoesNotExistBanner: false,
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
          searchIndexName: null,
          searchStageOperator: null,
          showSearchIndexDoesNotExistBanner: false,
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
          searchIndexName: 'test-index',
          searchStageOperator: '$search',
          showSearchIndexDoesNotExistBanner: false,
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
