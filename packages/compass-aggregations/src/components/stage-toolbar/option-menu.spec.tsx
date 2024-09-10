import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { OptionMenu } from './option-menu';
import sinon from 'sinon';

describe('OptionMenu', function () {
  it('renders option menu', function () {
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    expect(screen.getByLabelText('Options')).to.exist;
  });
  it('opens the menu when clicked', function () {
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    screen.getByLabelText('Options').click();
    expect(screen.getByText('Add stage after')).to.exist;
    expect(screen.getByText('Add stage before')).to.exist;
    expect(screen.getByText('Delete stage')).to.exist;
  });
  it('calls onAddStageClick when Add stage after is clicked', function () {
    const onAddStageClick = sinon.spy();
    render(
      <OptionMenu
        index={1}
        onAddStageClick={onAddStageClick}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    screen.getByLabelText('Options').click();
    expect(onAddStageClick).to.not.have.been.called;
    screen.getByText('Add stage after').click();
    expect(onAddStageClick).to.have.been.calledOnceWith(1);
  });
  it('calls onAddStageClick when Add stage before is clicked', function () {
    const onAddStageClick = sinon.spy();
    render(
      <OptionMenu
        index={1}
        onAddStageClick={onAddStageClick}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    screen.getByLabelText('Options').click();
    expect(onAddStageClick).to.not.have.been.called;
    screen.getByText('Add stage before').click();
    expect(onAddStageClick).to.have.been.calledOnceWith(0);
  });
  it('calls onDeleteStageClick when Delete stage is clicked', function () {
    const onDeleteStageClick = sinon.spy();
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={onDeleteStageClick}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    screen.getByLabelText('Options').click();
    expect(onDeleteStageClick).to.not.have.been.called;
    screen.getByText('Delete stage').click();
    expect(onDeleteStageClick).to.have.been.calledOnceWith(0);
  });
  it('calls expandPreviewDocsForStage when Expand documents is clicked', function () {
    const expandPreviewDocsForStageSpy = sinon.spy();
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={() => {}}
        onExpand={expandPreviewDocsForStageSpy}
        onCollapse={() => {}}
      />
    );
    screen.getByLabelText('Options').click();
    expect(expandPreviewDocsForStageSpy).to.not.have.been.called;
    screen.getByText('Expand documents').click();
    expect(expandPreviewDocsForStageSpy).to.have.been.calledOnceWith(0);
  });
  it('calls collapsePreviewDocsForStage when Collapse documents is clicked', function () {
    const collapsePreviewDocsForStageSpy = sinon.spy();
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={collapsePreviewDocsForStageSpy}
      />
    );
    screen.getByLabelText('Options').click();
    expect(collapsePreviewDocsForStageSpy).to.not.have.been.called;
    screen.getByText('Collapse documents').click();
    expect(collapsePreviewDocsForStageSpy).to.have.been.calledOnceWith(0);
  });
});
