import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';
import { MergeStage, OutStage } from './output-stage-preview';
import {
  OUT_STAGE_PREVIEW_TEXT,
  MERGE_STAGE_PREVIEW_TEXT,
} from '../../utils/stage';

const renderOutStage = (
  props: Partial<ComponentProps<typeof OutStage>> = {}
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
      <OutStage
        isLoading={false}
        isFinishedPersistingDocuments={false}
        destinationNamespace=""
        hasServerError={false}
        isAtlasDeployed={false}
        onGoToOutputResults={() => {}}
        onRunOutputStage={() => {}}
        {...props}
      />
    </Provider>
  );
};

const renderMergeStage = (
  props: Partial<ComponentProps<typeof MergeStage>> = {}
) => {
  render(
    <Provider
      store={configureStore({
        sourcePipeline: [
          { $match: { _id: 1 } },
          { $limit: 10 },
          { $merge: 'docs' },
        ],
      })}
    >
      <MergeStage
        isLoading={false}
        isFinishedPersistingDocuments={false}
        destinationNamespace=""
        hasServerError={false}
        isAtlasDeployed={false}
        onGoToOutputResults={() => {}}
        onRunOutputStage={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('OutputStagePreview', function () {
  describe('Out Stage', function () {
    context('renders loader when stage is loading', function () {
      it('renders loader with namespace', function () {
        renderOutStage({ isLoading: true, destinationNamespace: 'test.out' });
        expect(screen.getByText(/Persisting documents to test.out/i)).to.exist;
      });

      it('renders loader with generic text', function () {
        renderOutStage({ isLoading: true });
        expect(screen.getByText(/Persisting documents .../i)).to.exist;
      });
    });

    it('renders nothing on server error', function () {
      renderOutStage({ hasServerError: true });
      expect(screen.queryByText(OUT_STAGE_PREVIEW_TEXT)).to.not.exist;
    });

    context('when documents have been persisted', function () {
      context('renders the out stage preview', function () {
        it('with namespace', function () {
          renderOutStage({
            isFinishedPersistingDocuments: true,
            destinationNamespace: 'test.out',
          });
          expect(
            screen.getByText(/Documents persisted to collection: test.out/i)
          ).to.exist;
        });

        it('without namespace', function () {
          renderOutStage({ isFinishedPersistingDocuments: true });
          expect(
            screen.getByText(/Documents persisted to specified collection/i)
          ).to.exist;
        });
      });

      it('renders go to collection button', function () {
        renderOutStage({ isFinishedPersistingDocuments: true });
        expect(screen.getByTestId('go-to-out-collection')).to.exist;
      });
    });

    context('default stage of component', function () {
      it('renders the out stage preview', function () {
        renderOutStage();
        expect(screen.getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
      });
      it('renders save documents button on atlas', function () {
        renderOutStage({ isAtlasDeployed: true });
        expect(screen.getByTestId('save-out-documents')).to.exist;
      });
    });
  });

  describe('Merge Stage', function () {
    context('renders loader when stage is loading', function () {
      it('renders loader with namespace', function () {
        renderMergeStage({
          isLoading: true,
          destinationNamespace: 'test.docs',
        });
        expect(screen.getByText(/Persisting documents to test.docs/i)).to.exist;
      });

      it('renders loader with generic text', function () {
        renderMergeStage({ isLoading: true });
        expect(screen.getByText(/Persisting documents .../i)).to.exist;
      });
    });

    it('renders nothing on server error', function () {
      renderMergeStage({ hasServerError: true });
      expect(screen.queryByText(MERGE_STAGE_PREVIEW_TEXT)).to.not.exist;
    });

    context('when documents have been persisted', function () {
      context('renders the merge stage preview', function () {
        it('with namespace', function () {
          renderMergeStage({
            isFinishedPersistingDocuments: true,
            destinationNamespace: 'test.docs',
          });
          expect(
            screen.getByText(/Documents persisted to collection: test.docs/i)
          ).to.exist;
        });

        it('without namespace', function () {
          renderMergeStage({ isFinishedPersistingDocuments: true });
          expect(
            screen.getByText(/Documents persisted to specified collection/i)
          ).to.exist;
        });
      });

      it('renders go to collection button', function () {
        renderMergeStage({ isFinishedPersistingDocuments: true });
        expect(screen.getByTestId('go-to-merge-collection')).to.exist;
      });
    });

    context('default stage of component', function () {
      it('renders the merge stage preview', function () {
        renderMergeStage();
        expect(screen.getByText(MERGE_STAGE_PREVIEW_TEXT)).to.exist;
      });
      it('renders save documents button on atlas', function () {
        renderMergeStage({ isAtlasDeployed: true });
        expect(screen.getByTestId('save-merge-documents')).to.exist;
      });
    });
  });
});
