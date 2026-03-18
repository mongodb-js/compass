import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { expect } from 'chai';
import type { MongoServerError } from 'mongodb';

import { StageEditor } from './stage-editor';

describe('StageEditor [Component]', function () {
  const spy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';

  afterEach(cleanup);

  beforeEach(function () {
    render(
      <StageEditor
        namespace="test.test"
        stageValue={stage}
        stageOperator={stageOperator}
        index={0}
        serverVersion="3.6.0"
        onChange={spy}
        syntaxError={null}
        serverError={null}
        num_stages={0}
        editor_view_type="text"
        searchIndexes={[]}
      />
    );
  });

  it('renders the wrapper div', function () {
    expect(screen.getByTestId('stage-editor')).to.exist;
  });

  describe('error and warning banners', function () {
    it('should show syntax error banner when syntaxError exists', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue=""
          stageOperator="$match"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={{ message: 'Invalid syntax', loc: { index: 0 } }}
          serverError={null}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
        />
      );

      expect(screen.getByTestId('stage-editor-syntax-error')).to.exist;
      expect(screen.getByText('Invalid syntax')).to.exist;
    });

    it('should show server error banner when serverError exists', function () {
      const serverError = {
        message: 'Server error occurred',
      } as MongoServerError;

      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={serverError}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onEditSearchIndexClick={spy}
        />
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.getByText('Server error occurred')).to.exist;
    });

    it('should show search index does not exist banner when appropriate', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "nonexistent" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={null}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onViewSearchIndexesClick={spy}
          onCreateSearchIndexClick={spy}
        />
      );

      expect(screen.getByText(/index doesn't exist/i)).to.exist;
      expect(screen.getByText('View Search Indexes')).to.exist;
      expect(screen.getByText('Create a New Index')).to.exist;
    });

    it('should show search index does not exist banner for $vectorSearch', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "nonexistent" }'
          stageOperator="$vectorSearch"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={null}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onViewSearchIndexesClick={spy}
          onCreateSearchIndexClick={spy}
        />
      );

      expect(screen.getByText(/Vector search index doesn't exist/i)).to.exist;
      expect(screen.getByText('View Search Indexes')).to.exist;
      expect(screen.getByText('Create a New Index')).to.exist;
    });

    it('should prioritize serverError over searchIndexDoesNotExist', function () {
      const serverError = { message: 'Server error' } as MongoServerError;

      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={serverError}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
        />
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });

    it('should prioritize syntaxError over searchIndexDoesNotExist', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={{ message: 'Syntax error', loc: { index: 0 } }}
          serverError={null}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
        />
      );

      expect(screen.getByTestId('stage-editor-syntax-error')).to.exist;
      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });

    it('should not show action links in focus mode for search index does not exist banner', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={null}
          num_stages={1}
          editor_view_type="focus"
          searchIndexes={[]}
          onViewSearchIndexesClick={spy}
          onCreateSearchIndexClick={spy}
        />
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

      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test-index" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={serverError}
          num_stages={1}
          editor_view_type="focus"
          searchIndexes={[]}
          onEditSearchIndexClick={spy}
        />
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText('Edit Search Index')).to.not.exist;
    });

    it('should show edit link for search index definition errors', function () {
      const serverError = {
        message: "geoWithin requires path 'location' to be indexed as 'geo'",
      } as MongoServerError;

      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test-index" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={serverError}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onEditSearchIndexClick={spy}
        />
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.getByText('Edit Search Index')).to.exist;
    });

    it('should not show edit link for non-definition server errors', function () {
      const serverError = {
        message: 'Connection timeout',
      } as MongoServerError;

      render(
        <StageEditor
          namespace="test.test"
          stageValue='{ index: "test-index" }'
          stageOperator="$search"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={serverError}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onEditSearchIndexClick={spy}
        />
      );

      expect(screen.getByTestId('stage-editor-error-message')).to.exist;
      expect(screen.queryByText('Edit Search Index')).to.not.exist;
    });

    it('should not show search index does not exist banner for non-search stages', function () {
      render(
        <StageEditor
          namespace="test.test"
          stageValue="{ _id: 1 }"
          stageOperator="$match"
          index={0}
          serverVersion="3.6.0"
          onChange={spy}
          syntaxError={null}
          serverError={null}
          num_stages={1}
          editor_view_type="text"
          searchIndexes={[]}
          onViewSearchIndexesClick={spy}
          onCreateSearchIndexClick={spy}
        />
      );

      expect(screen.queryByText(/index doesn't exist/i)).to.not.exist;
    });
  });
});
