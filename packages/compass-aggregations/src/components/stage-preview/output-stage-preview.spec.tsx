import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { OutputStage } from './output-stage-preview';
import { PreferencesProvider } from 'compass-preferences-model/provider';

describe('OutputStagePreview', function () {
  let preferences: PreferencesAccess;

  const renderOutputStage = (
    props: Partial<ComponentProps<typeof OutputStage>> = {}
  ) => {
    render(
      <PreferencesProvider value={preferences}>
        <OutputStage
          operator={null}
          isLoading={false}
          isFinishedPersistingDocuments={false}
          destinationNamespace="foo.bar"
          hasServerError={false}
          onGoToOutputResults={() => {}}
          onRunOutputStage={() => {}}
          {...props}
        />
      </PreferencesProvider>
    );
  };

  afterEach(cleanup);
  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  it('renders nothing for a non-out stage', function () {
    renderOutputStage({ operator: '$match' });
    expect(screen.queryAllByText(/./)).to.have.lengthOf(0);
  });

  for (const operator of ['$out', '$merge']) {
    describe(`${operator} stage`, function () {
      describe('with enableAggregationBuilderRunPipeline set to `true`', function () {
        beforeEach(async function () {
          await preferences.savePreferences({
            enableAggregationBuilderRunPipeline: true,
          });
        });

        it('shows stage description in default state', function () {
          renderOutputStage({ operator });
          expect(
            screen.getByText(
              new RegExp(`The \\${operator} operator will cause the pipeline`)
            )
          ).to.exist;
        });

        it('does not show the "run" button', function () {
          renderOutputStage({ operator });
          expect(
            screen.queryByRole('button', {
              name:
                operator === '$merge' ? 'Merge Documents' : 'Save Documents',
            })
          ).to.eq(null);
        });

        it('shows stage description in error state', function () {
          renderOutputStage({ operator, hasServerError: true });
          expect(
            screen.getByText(
              new RegExp(`The \\${operator} operator will cause the pipeline`)
            )
          ).to.exist;
        });

        it('shows stage description in loading state', function () {
          renderOutputStage({ operator, isLoading: true });
          expect(
            screen.getByText(
              new RegExp(`The \\${operator} operator will cause the pipeline`)
            )
          ).to.exist;
        });

        it('shows stage description in finished state', function () {
          renderOutputStage({ operator, isFinishedPersistingDocuments: true });
          expect(
            screen.getByText(
              new RegExp(`The \\${operator} operator will cause the pipeline`)
            )
          ).to.exist;
        });
      });

      describe('with enableAggregationBuilderRunPipeline set to `false`', function () {
        beforeEach(async function () {
          await preferences.savePreferences({
            enableAggregationBuilderRunPipeline: false,
          });
        });

        it('shows stage description in default state', function () {
          renderOutputStage({ operator });
          expect(
            screen.getByText(
              new RegExp(`The \\${operator} operator will cause the pipeline`)
            )
          ).to.exist;
        });

        it('shows the "run" button', function () {
          renderOutputStage({ operator });
          expect(
            screen.getByRole('button', {
              name:
                operator === '$merge' ? 'Merge Documents' : 'Save Documents',
            })
          ).to.exist;
        });

        it('shows nothing in error state', function () {
          renderOutputStage({ operator, hasServerError: true });
          expect(screen.queryAllByText(/./)).to.have.lengthOf(0);
        });

        it('shows loader in loading state', function () {
          renderOutputStage({ operator, isLoading: true });
          expect(screen.getByText(/Persisting Documents to foo.bar/)).to.exist;
        });

        it('shows "Documents persisted ..." in finished state', function () {
          renderOutputStage({ operator, isFinishedPersistingDocuments: true });
          expect(screen.getByText(/Documents persisted to collection: foo.bar/))
            .to.exist;
          expect(screen.getByRole('button', { name: 'Go to collection.' })).to
            .exist;
        });
      });
    });
  }
});
