import React from 'react';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import userEvent from '@testing-library/user-event';

import { renderWithStore } from '../../../../test/configure-store';

import { OutputStagePreview } from './pipeline-stages-preview';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

describe('OutputStagePreview', function () {
  let preferences: PreferencesAccess;
  const renderStageBanner = (
    props: Partial<ComponentProps<typeof OutputStagePreview>> = {}
  ) => {
    return renderWithStore(
      <OutputStagePreview
        stageOperator="$out"
        isComplete={false}
        isLoading={false}
        onOpenCollection={() => {}}
        onSaveCollection={() => {}}
        {...props}
      />,
      undefined,
      undefined,
      { preferences }
    );
  };

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  (['$out', '$merge'] as const).forEach((stageOperator) => {
    describe(`${stageOperator} with run aggregation enabled`, function () {
      it('renders stage banner', async function () {
        await renderStageBanner({ stageOperator });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
        expect(() => {
          screen.getByRole('button', {
            name: /save documents/i,
          });
        }).to.throw;
      });
    });

    describe(`${stageOperator} with run aggregation disabled`, function () {
      beforeEach(async function () {
        await preferences.savePreferences({
          enableAggregationBuilderRunPipeline: false,
        });
      });

      it(`renders stage banner`, async function () {
        await renderStageBanner({
          stageOperator,
        });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
      });

      it(`renders stage action`, async function () {
        await renderStageBanner({
          stageOperator,
        });
        expect(
          screen.getByRole('button', {
            name: /save documents/i,
          })
        ).to.exist;
      });

      it(`calls stage action on click`, async function () {
        const onSaveCollection = sinon.spy();
        await renderStageBanner({
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

      it('renders loading state', async function () {
        await renderStageBanner({
          stageOperator,
          isLoading: true,
        });
        const button = screen.getByRole('button', {
          name: /save documents/i,
        });
        expect(button.getAttribute('aria-disabled')).to.equal('true');
      });

      it('renders complete state', async function () {
        await renderStageBanner({
          stageOperator,
          isComplete: true,
        });
        expect(screen.getByTestId(`${stageOperator}-is-complete-banner`)).to
          .exist;
      });

      it('renders complete state action button', async function () {
        await renderStageBanner({
          stageOperator,
          isComplete: true,
        });
        const button = screen.getByRole('button', {
          name: /go to collection/i,
        });
        expect(button).to.exist;
      });

      it('calls complete state action button', async function () {
        const onOpenCollection = sinon.spy();
        await renderStageBanner({
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
