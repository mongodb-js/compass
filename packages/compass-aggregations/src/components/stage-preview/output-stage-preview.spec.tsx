import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';
import { OutputStage } from './output-stage-preview';

const renderOutputStage = (
  props: Partial<ComponentProps<typeof OutputStage>> = {}
) => {
  render(
    <Provider
      store={configureStore({
        pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }],
      })}
    >
      <OutputStage
        operator={null}
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
  (['$out', '$merge'] as const).forEach(function (operator) {
    describe(`${operator} stage`, function () {
      context('renders loader when stage is loading', function () {
        it('renders loader with namespace', function () {
          renderOutputStage({
            operator,
            isLoading: true,
            destinationNamespace: 'test.out',
          });
          expect(
            screen.getByText(/Persisting documents to test.out/i)
          ).to.exist;
        });

        it('renders loader with generic text', function () {
          renderOutputStage({ operator, isLoading: true });
          expect(screen.getByText(/Persisting documents .../i)).to.exist;
        });
      });

      it('renders nothing on server error', function () {
        renderOutputStage({ operator, hasServerError: true });
        expect(() => {
          screen.getByTestId('output-stage-text');
        }).to.throw;
      });

      context('when documents have been persisted', function () {
        context('renders the out stage preview', function () {
          it('with namespace', function () {
            renderOutputStage({
              operator,
              isFinishedPersistingDocuments: true,
              destinationNamespace: 'test.out',
            });
            expect(
              screen.getByText(/Documents persisted to collection: test.out/i)
            ).to.exist;
          });

          it('without namespace', function () {
            renderOutputStage({
              operator,
              isFinishedPersistingDocuments: true,
            });
            expect(
              screen.getByText(/Documents persisted to specified collection/i)
            ).to.exist;
          });
        });

        it('renders go to collection button', function () {
          renderOutputStage({ operator, isFinishedPersistingDocuments: true });
          expect(screen.getByTestId('goto-output-collection')).to.exist;
        });
      });

      context('default stage of component', function () {
        it('renders the out stage preview', function () {
          renderOutputStage({ operator });
          expect(screen.getByTestId('output-stage-text')).to.exist;
        });
        it('renders save documents button on atlas', function () {
          renderOutputStage({ operator, isAtlasDeployed: true });
          expect(screen.getByTestId('save-output-documents')).to.exist;
        });
      });
    });
  });
});
