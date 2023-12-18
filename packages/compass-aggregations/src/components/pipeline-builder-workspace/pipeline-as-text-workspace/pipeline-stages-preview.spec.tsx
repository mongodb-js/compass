import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import configureStore from '../../../../test/configure-store';

import { OutputStagePreview } from './pipeline-stages-preview';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

describe('OutputStagePreview', function () {
  let preferences: PreferencesAccess;
  const renderStageBanner = (
    props: Partial<ComponentProps<typeof OutputStagePreview>> = {}
  ) => {
    render(
      <PreferencesProvider value={preferences}>
        <Provider store={configureStore()}>
          <OutputStagePreview
            stageOperator="$out"
            isComplete={false}
            isLoading={false}
            onOpenCollection={() => {}}
            onSaveCollection={() => {}}
            {...props}
          />
        </Provider>
      </PreferencesProvider>
    );
  };

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  (['$out', '$merge'] as const).forEach((stageOperator) => {
    describe(`${stageOperator} with run aggregation enabled`, function () {
      it('renders stage banner', function () {
        renderStageBanner({ stageOperator });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
        expect(() => {
          screen.getByRole('button', {
            name: /save documents/i,
          });
        }).to.throw;
      });
    });

    describe(`${stageOperator} with run aggregation disabled`, function () {
      before(async function () {
        await preferences.savePreferences({
          enableAggregationBuilderRunPipeline: false,
        });
      });

      it(`renders stage banner`, function () {
        renderStageBanner({
          stageOperator,
        });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
      });

      it(`renders stage action`, function () {
        renderStageBanner({
          stageOperator,
        });
        expect(
          screen.getByRole('button', {
            name: /save documents/i,
          })
        ).to.exist;
      });

      it(`calls stage action on click`, function () {
        const onSaveCollection = sinon.spy();
        renderStageBanner({
          stageOperator,
          onSaveCollection,
        });
        const button = screen.getByRole('button', {
          name: /save documents/i,
        });
        expect(onSaveCollection.calledOnce).to.be.false;
        userEvent.click(button);
        expect(onSaveCollection.calledOnce).to.be.true;
      });

      it('renders loading state', function () {
        renderStageBanner({
          stageOperator,
          isLoading: true,
        });
        const button = screen.getByRole('button', {
          name: /save documents/i,
        });
        expect(button).to.have.attribute('disabled');
      });

      it('renders complete state', function () {
        renderStageBanner({
          stageOperator,
          isComplete: true,
        });
        expect(screen.getByTestId(`${stageOperator}-is-complete-banner`)).to
          .exist;
      });

      it('renders complete state action button', function () {
        renderStageBanner({
          stageOperator,
          isComplete: true,
        });
        const button = screen.getByRole('button', {
          name: /go to collection/i,
        });
        expect(button).to.exist;
      });

      it('calls complete state action button', function () {
        const onOpenCollection = sinon.spy();
        renderStageBanner({
          stageOperator,
          isComplete: true,
          onOpenCollection,
        });
        const button = screen.getByRole('button', {
          name: /go to collection/i,
        });
        expect(onOpenCollection.calledOnce).to.be.false;
        userEvent.click(button);
        expect(onOpenCollection.calledOnce).to.be.true;
      });
    });
  });
});
