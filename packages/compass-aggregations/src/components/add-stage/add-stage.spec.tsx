import React, { type ComponentProps } from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { AddStage } from './add-stage';
import { cleanup, render, screen, within } from '@testing-library/react';

const renderAddStage = (
  props: Partial<ComponentProps<typeof AddStage>> = {}
) => {
  render(
    <AddStage
      index={0}
      renderUseCaseDropMarker={false}
      onAddStage={() => {}}
      variant="button"
      {...props}
    />
  );
};

describe('AddStage', function () {
  afterEach(cleanup);

  context('add stage icon button', function () {
    it('renders icon button', function () {
      renderAddStage({ variant: 'icon' });
      const button = screen.getByTestId('add-stage-icon-button');
      expect(() => {
        within(button).getByText('Add Stage');
      }).to.throw;
    });

    it('calls onAddStage with index when clicked', function () {
      const onAddStage = sinon.spy();
      renderAddStage({ variant: 'icon', onAddStage });
      const button = screen.getByTestId('add-stage-icon-button');
      expect(onAddStage).not.to.have.been.called;
      button.click();
      expect(onAddStage).to.have.been.calledOnce;
    });

    it('renders a drop marker when renderUseCaseDropMarker is true', function () {
      renderAddStage({
        variant: 'icon',
        renderUseCaseDropMarker: true,
        index: 1,
      });
      expect(screen.getByTestId(`use-case-drop-marker-1`)).to.not.throw;
      expect(
        screen.getByTestId(`use-case-drop-marker-1`).getAttribute('style')
      ).to.contain('visibility: hidden');
    });
  });

  context('add stage button with link', function () {
    it('renders text button', function () {
      renderAddStage({ variant: 'button' });
      const button = screen.getByTestId('add-stage');
      expect(within(button).getByText('Add Stage')).to.exist;
    });

    it('renders help link when stage is not last', function () {
      renderAddStage();
      expect(
        screen.getByText('Learn more about aggregation pipeline stages')
      ).to.exist;
    });

    it('calls onAddStage with index when clicked', function () {
      const onAddStage = sinon.spy();
      renderAddStage({ variant: 'button', onAddStage });
      const button = screen.getByTestId('add-stage');
      expect(onAddStage).not.to.have.been.called;
      button.click();
      expect(onAddStage).to.have.been.calledOnce;
    });

    it('renders a drop marker when renderUseCaseDropMarker is true', function () {
      renderAddStage({
        variant: 'button',
        renderUseCaseDropMarker: true,
        index: 1,
      });
      expect(screen.getByTestId(`use-case-drop-marker-1`)).to.not.throw;
      expect(
        screen.getByTestId(`use-case-drop-marker-1`).getAttribute('style')
      ).to.contain('visibility: hidden');
    });
  });
});
