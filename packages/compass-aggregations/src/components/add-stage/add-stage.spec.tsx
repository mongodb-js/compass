import React, { type ComponentProps } from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { AddStage } from './add-stage';
import { render, screen, within } from '@testing-library/react';

const renderAddStage = (
  props: Partial<ComponentProps<typeof AddStage>> = {}
) => {
  render(
    <AddStage
      onAddStage={() => {}}
      variant="button"
      {...props}
    />
  );
};

describe('AddStage', function() {
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

  });

  context('add stage button with link', function () {
    it('renders text button', function () {
      renderAddStage({ variant: 'button' });
      const button = screen.getByTestId('add-stage');
      expect(within(button).getByText('Add Stage')).to.exist;
    });

    it('renders help link when stage is not last', function () {
      renderAddStage();
      expect(screen.getByText('Learn more about aggregation pipeline stages')).to.exist;
    });

    it('calls onAddStage with index when clicked', function () {
      const onAddStage = sinon.spy();
      renderAddStage({ variant: 'button', onAddStage });
      const button = screen.getByTestId('add-stage');
      expect(onAddStage).not.to.have.been.called;
      button.click();
      expect(onAddStage).to.have.been.calledOnce;
    });
  });
});
