import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
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
  it('opens the menu when clicked', async function () {
    render(
      <OptionMenu
        index={0}
        onAddStageClick={() => {}}
        onDeleteStageClick={() => {}}
        onExpand={() => {}}
        onCollapse={() => {}}
      />
    );
    userEvent.click(screen.getByLabelText('Options'));
    expect(await screen.findByText('Add stage after')).to.exist;
    expect(await screen.findByText('Add stage before')).to.exist;
    expect(await screen.findByText('Delete stage')).to.exist;
  });
  it('calls onAddStageClick when Add stage after is clicked', async function () {
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
    userEvent.click(screen.getByLabelText('Options'));
    expect(onAddStageClick).to.not.have.been.called;
    userEvent.click(await screen.findByText('Add stage after'));
    expect(onAddStageClick).to.have.been.calledOnceWith(1);
  });
  it('calls onAddStageClick when Add stage before is clicked', async function () {
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
    userEvent.click(screen.getByLabelText('Options'));
    expect(onAddStageClick).to.not.have.been.called;
    userEvent.click(await screen.findByText('Add stage before'));
    expect(onAddStageClick).to.have.been.calledOnceWith(0);
  });
  it('calls onDeleteStageClick when Delete stage is clicked', async function () {
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
    userEvent.click(screen.getByLabelText('Options'));
    expect(onDeleteStageClick).to.not.have.been.called;
    userEvent.click(await screen.findByText('Delete stage'));
    expect(onDeleteStageClick).to.have.been.calledOnceWith(0);
  });
  it('calls expandPreviewDocsForStage when Expand documents is clicked', async function () {
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
    userEvent.click(screen.getByLabelText('Options'));
    expect(expandPreviewDocsForStageSpy).to.not.have.been.called;
    userEvent.click(await screen.findByText('Expand documents'));
    expect(expandPreviewDocsForStageSpy).to.have.been.calledOnceWith(0);
  });
  it('calls collapsePreviewDocsForStage when Collapse documents is clicked', async function () {
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
    userEvent.click(screen.getByLabelText('Options'));
    expect(collapsePreviewDocsForStageSpy).to.not.have.been.called;
    userEvent.click(await screen.findByText('Collapse documents'));
    expect(collapsePreviewDocsForStageSpy).to.have.been.calledOnceWith(0);
  });
});
