import React from 'react';
import { expect } from 'chai';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { DiagramEditorToolbar } from './diagram-editor-toolbar';
import sinon from 'sinon';

function renderDiagramEditorToolbar(
  props: Partial<React.ComponentProps<typeof DiagramEditorToolbar>> = {}
) {
  render(
    <DiagramEditorToolbar
      step="EDITING"
      hasUndo={true}
      hasRedo={true}
      onDownloadClick={() => {}}
      onUndoClick={() => {}}
      onRedoClick={() => {}}
      onExportClick={() => {}}
      {...props}
    />
  );
}

describe('DiagramEditorToolbar', function () {
  it('renders nothing if step is NO_DIAGRAM_SELECTED', function () {
    renderDiagramEditorToolbar({ step: 'NO_DIAGRAM_SELECTED' });
    expect(() => screen.getByTestId('diagram-editor-toolbar')).to.throw();
  });

  it('renders nothing if step is not EDITING', function () {
    renderDiagramEditorToolbar({ step: 'ANALYSIS_CANCELED' });
    expect(() => screen.getByTestId('diagram-editor-toolbar')).to.throw();
  });

  context('undo button', function () {
    it('renders it disabled if hasUndo is false', function () {
      renderDiagramEditorToolbar({ hasUndo: false });
      const undoButton = screen.getByRole('button', { name: 'Undo' });
      expect(undoButton).to.have.attribute('aria-disabled', 'true');
    });
    it('renders it enabled if hasUndo is true and calls onUndoClick', function () {
      const undoSpy = sinon.spy();
      renderDiagramEditorToolbar({ hasUndo: true, onUndoClick: undoSpy });
      const undoButton = screen.getByRole('button', { name: 'Undo' });
      expect(undoButton).to.have.attribute('aria-disabled', 'false');
      userEvent.click(undoButton);
      expect(undoSpy).to.have.been.calledOnce;
    });
  });

  context('redo button', function () {
    it('renders it disabled if hasRedo is false', function () {
      renderDiagramEditorToolbar({ hasRedo: false });
      const redoButton = screen.getByRole('button', { name: 'Redo' });
      expect(redoButton).to.have.attribute('aria-disabled', 'true');
    });
    it('renders it enabled if hasRedo is true and calls onRedoClick', function () {
      const redoSpy = sinon.spy();
      renderDiagramEditorToolbar({ hasRedo: true, onRedoClick: redoSpy });
      const redoButton = screen.getByRole('button', { name: 'Redo' });
      expect(redoButton).to.have.attribute('aria-disabled', 'false');
      userEvent.click(redoButton);
      expect(redoSpy).to.have.been.calledOnce;
    });
  });

  it('renders export button and calls onExportClick', function () {
    const exportSpy = sinon.spy();
    renderDiagramEditorToolbar({ onExportClick: exportSpy });
    const exportButton = screen.getByRole('button', { name: 'Export' });
    expect(exportButton).to.exist;
    userEvent.click(exportButton);
    expect(exportSpy).to.have.been.calledOnce;
  });

  it('renders download button and calls onDownloadClick', function () {
    const downloadSpy = sinon.spy();
    renderDiagramEditorToolbar({ onDownloadClick: downloadSpy });
    const downloadButton = screen.getByRole('button', { name: 'Download' });
    expect(downloadButton).to.exist;
    userEvent.click(downloadButton);
    expect(downloadSpy).to.have.been.calledOnce;
  });
});
