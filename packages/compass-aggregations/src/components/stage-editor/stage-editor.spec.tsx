import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { expect } from 'chai';
import type { MongoServerError } from 'mongodb';

import { StageEditor } from './stage-editor';

const renderStageEditor = (
  props: Partial<ComponentProps<typeof StageEditor>> = {},
  renderOptions: any = {}
) => {
  return render(
    <StageEditor
      namespace="test.test"
      stageValue='{ name: "testing" }'
      stageOperator="$match"
      index={0}
      serverVersion="3.6.0"
      onChange={() => {}}
      syntaxError={null}
      serverError={null}
      num_stages={0}
      editor_view_type="text"
      searchIndexName={null}
      showSearchIndexDoesNotExistBanner={false}
      onViewSearchIndexesClick={() => {}}
      onCreateSearchIndexClick={() => {}}
      onEditSearchIndexClick={() => {}}
      {...props}
    />,
    renderOptions
  );
};

describe('StageEditor [Component]', function () {
  const spy = sinon.spy();

  afterEach(cleanup);

  beforeEach(function () {
    renderStageEditor({ onChange: spy });
  });

  it('renders the wrapper div', function () {
    expect(screen.getByTestId('stage-editor')).to.exist;
  });

  describe('error and warning banners', function () {
    it('should show syntax error banner when syntaxError exists', function () {
      renderStageEditor({
        stageValue: '',
        syntaxError: { message: 'Invalid syntax', loc: { index: 0 } },
        num_stages: 1,
      });

      expect(screen.getByTestId('stage-editor-syntax-error')).to.exist;
      expect(screen.getByText('Invalid syntax')).to.exist;
    });

    it('should show server error banner when serverError exists', function () {
      const serverError = {
        message: 'Server error occurred',
      } as MongoServerError;

      renderStageEditor({
        stageValue: '{ index: "test" }',
        stageOperator: '$search',
        serverError,
        num_stages: 1,
        searchIndexName: 'test',
      });

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.getByText('Server error occurred')).to.exist;
    });

    it('should show search index does not exist banner when appropriate', function () {
      renderStageEditor(
        {
          stageValue: '{ index: "nonexistent" }',
          stageOperator: '$search',
          num_stages: 1,
          searchIndexName: 'nonexistent',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.getByText(/index doesn't exist/i)).to.exist;
      expect(screen.getByText('View Search Indexes')).to.exist;
      expect(screen.getByText('Create a New Index')).to.exist;
    });

    it('should show search index does not exist banner for $vectorSearch', function () {
      renderStageEditor(
        {
          stageValue: '{ index: "nonexistent" }',
          stageOperator: '$vectorSearch',
          num_stages: 1,
          searchIndexName: 'nonexistent',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.getByText(/Vector search index doesn't exist/i)).to.exist;
      expect(screen.getByText('View Search Indexes')).to.exist;
      expect(screen.getByText('Create a New Index')).to.exist;
    });

    it('should prioritize serverError over searchIndexDoesNotExist', function () {
      const serverError = { message: 'Server error' } as MongoServerError;

      renderStageEditor(
        {
          stageValue: '{ index: "test" }',
          stageOperator: '$search',
          serverError,
          num_stages: 1,
          searchIndexName: 'test',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });

    it('should prioritize syntaxError over searchIndexDoesNotExist', function () {
      renderStageEditor(
        {
          stageValue: '{ index: "test" }',
          stageOperator: '$search',
          syntaxError: { message: 'Syntax error', loc: { index: 0 } },
          num_stages: 1,
          searchIndexName: 'test',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.getByTestId('stage-editor-syntax-error')).to.exist;
      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });

    it('should not show action links in focus mode for search index does not exist banner', function () {
      renderStageEditor(
        {
          stageValue: '{ index: "test" }',
          stageOperator: '$search',
          num_stages: 1,
          editor_view_type: 'focus',
          searchIndexName: 'test',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      // Banner should show but without links
      expect(screen.getByText(/index doesn't exist/i)).to.exist;
      expect(screen.queryByText('View Search Indexes')).to.not.exist;
      expect(screen.queryByText('Create a New Index')).to.not.exist;
    });

    it('should not show edit link in focus mode for server error banner', function () {
      const serverError = {
        message: "geoWithin requires path 'location' to be indexed as 'geo'",
      } as MongoServerError;

      renderStageEditor({
        stageValue: '{ index: "test-index" }',
        stageOperator: '$search',
        serverError,
        num_stages: 1,
        editor_view_type: 'focus',
        searchIndexName: 'test-index',
      });

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText('Edit Search Index')).to.not.exist;
    });

    it('should show edit link for search index definition errors', function () {
      const serverError = {
        message: "geoWithin requires path 'location' to be indexed as 'geo'",
      } as MongoServerError;

      renderStageEditor({
        stageValue: '{ index: "test-index" }',
        stageOperator: '$search',
        serverError,
        num_stages: 1,
        searchIndexName: 'test-index',
      });

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.getByText('Edit Search Index')).to.exist;
    });

    it('should not show edit link for non-definition server errors', function () {
      const serverError = {
        message: 'Connection timeout',
      } as MongoServerError;

      renderStageEditor({
        stageValue: '{ index: "test-index" }',
        stageOperator: '$search',
        serverError,
        num_stages: 1,
        searchIndexName: 'test-index',
      });

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText('Edit Search Index')).to.not.exist;
    });

    it('should not show search index does not exist banner for non-search stages', function () {
      renderStageEditor(
        {
          stageValue: '{ _id: 1 }',
          num_stages: 1,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });

    it('should NOT show search index does not exist banner when feature flag is disabled', function () {
      renderStageEditor(
        {
          stageValue: '{ index: "nonexistent" }',
          stageOperator: '$search',
          num_stages: 1,
          searchIndexName: 'nonexistent',
          showSearchIndexDoesNotExistBanner: true,
        },
        {
          preferences: {
            enableSearchActivationProgramP1: false,
          },
        }
      );

      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });
  });
});
