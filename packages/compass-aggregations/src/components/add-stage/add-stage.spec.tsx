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
      index={0}
      numStages={1}
      onAddStageClick={() => {}}
      {...props}
    />
  );
};

describe('AddStage', function() {
  context('stage is not last', function () {
    const props = { index: 1, numStages: 3 };
    it('renders icon button', function () {
      renderAddStage(props);
      const button = screen.getByTestId('add-stage');
      expect(() => {
        within(button).getByText('Add Stage');
      }).to.throw;
    });

    it('calls onAddStageClick with index when clicked', function () {
      const onAddStageClick = sinon.spy();
      renderAddStage({ ...props, onAddStageClick });
      const button = screen.getByTestId('add-stage');
      expect(onAddStageClick).not.to.have.been.called;
      button.click();
      expect(onAddStageClick).to.have.been.calledOnceWith(1);
    });

  });

  context('stage is last', function () {
    const props = { index: 2, numStages: 3 };
    it('renders text button', function () {
      renderAddStage(props);
      const button = screen.getByTestId('add-stage');
      expect(within(button).getByText('Add Stage')).to.exist;
    });

    it('renders help link when stage is not last', function () {
      renderAddStage(props);
      expect(screen.getByText('Learn more about aggregation pipeline stages')).to.exist;
    });

    it('calls onAddStageClick with index when clicked', function () {
      const onAddStageClick = sinon.spy();
      renderAddStage({ ...props, onAddStageClick });
      const button = screen.getByTestId('add-stage');
      expect(onAddStageClick).not.to.have.been.called;
      button.click();
      expect(onAddStageClick).to.have.been.calledOnce;
    });
  });
});
