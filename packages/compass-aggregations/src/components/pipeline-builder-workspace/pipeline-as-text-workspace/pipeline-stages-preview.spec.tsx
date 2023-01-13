import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import configureStore from '../../../stores/store';

import { OutputStagePreview } from './pipeline-stages-preview';

const renderStageBanner = (
  props: Partial<ComponentProps<typeof OutputStagePreview>> = {}
) => {
  render(
    <Provider store={configureStore({})}>
      <OutputStagePreview
        stageOperator="$out"
        isAtlas={false}
        isComplete={false}
        isLoading={false}
        onOpenCollection={() => {}}
        onSaveCollection={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('OutputStagePreview', function () {
  (['$out', '$merge'] as const).forEach((stageOperator) => {
    describe(`${stageOperator} - not on atlas`, function () {
      it('renders stage banner', function () {
        renderStageBanner({
          stageOperator,
          isAtlas: false,
        });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
        expect(() => {
          screen.getByRole('button', {
            name: /save documents/i,
          });
        }).to.throw;
      });
    });

    describe(`${stageOperator} on atlas`, function () {
      it(`renders stage banner`, function () {
        renderStageBanner({
          stageOperator,
          isAtlas: true,
        });
        expect(screen.getByTestId(`${stageOperator}-preview-banner`)).to.exist;
      });

      it(`renders stage action`, function () {
        renderStageBanner({
          stageOperator,
          isAtlas: true,
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
          isAtlas: true,
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
          isAtlas: true,
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
          isAtlas: true,
          isComplete: true,
        });
        expect(screen.getByTestId(`${stageOperator}-is-complete-banner`)).to
          .exist;
      });

      it('renders complete state action button', function () {
        renderStageBanner({
          stageOperator,
          isAtlas: true,
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
          isAtlas: true,
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
