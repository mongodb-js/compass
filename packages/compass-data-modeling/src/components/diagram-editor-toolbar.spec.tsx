import React from 'react';
import { expect } from 'chai';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { DiagramEditorToolbar } from './diagram-editor-toolbar';
import sinon from 'sinon';
import {
  type WorkspacesService,
  WorkspacesServiceProvider,
} from '@mongodb-js/compass-workspaces/provider';

const workspacesService = {
  openDataModelingWorkspace: () => {},
} as WorkspacesService;

function renderDiagramEditorToolbar(
  props: Partial<React.ComponentProps<typeof DiagramEditorToolbar>> = {}
) {
  render(
    <WorkspacesServiceProvider value={workspacesService}>
      <DiagramEditorToolbar
        step="EDITING"
        hasUndo={true}
        hasRedo={true}
        isInRelationshipDrawingMode={false}
        onUndoClick={() => {}}
        onRedoClick={() => {}}
        onExportClick={() => {}}
        onRelationshipDrawingToggle={() => {}}
        onAddCollectionClick={() => {}}
        {...props}
      />
    </WorkspacesServiceProvider>
  );
}

describe('DiagramEditorToolbar', function () {
  beforeEach(function () {
    workspacesService.openDataModelingWorkspace = sinon.spy();
  });

  afterEach(function () {
    sinon.reset();
  });

  it('renders nothing if step is NO_DIAGRAM_SELECTED', function () {
    renderDiagramEditorToolbar({ step: 'NO_DIAGRAM_SELECTED' });
    expect(() => screen.getByTestId('diagram-editor-toolbar')).to.throw();
  });

  it('renders nothing if step is not EDITING', function () {
    renderDiagramEditorToolbar({ step: 'ANALYSIS_CANCELED' });
    expect(() => screen.getByTestId('diagram-editor-toolbar')).to.throw();
  });

  context('breadcrumbs', function () {
    it('includes "diagrams" breadcrumb', function () {
      renderDiagramEditorToolbar();
      const diagrams = screen.getByRole('button', { name: 'diagrams' });
      expect(diagrams).to.be.visible;
      userEvent.click(diagrams);
      expect(
        workspacesService.openDataModelingWorkspace
      ).to.have.been.calledOnce;
    });

    it('includes diagram name breadcrumb', function () {
      renderDiagramEditorToolbar({ diagramName: 'My Diagram' });
      expect(screen.getByText('My Diagram')).to.be.visible;
    });
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

  context('add collection button', function () {
    it('starts adding collection', function () {
      const addCollectionSpy = sinon.spy();
      renderDiagramEditorToolbar({ onAddCollectionClick: addCollectionSpy });
      const addButton = screen.getByRole('button', { name: 'Add Collection' });
      userEvent.click(addButton);
      expect(addCollectionSpy).to.have.been.calledOnce;
    });
  });

  context('add relationship button', function () {
    it('renders it active if isInRelationshipDrawingMode is true', function () {
      renderDiagramEditorToolbar({ isInRelationshipDrawingMode: true });
      const addButton = screen.getByRole('button', {
        name: 'Exit Relationship Drawing Mode',
      });
      expect(addButton).to.have.attribute('aria-pressed', 'true');
    });

    it('does not render it active if isInRelationshipDrawingMode is false', function () {
      renderDiagramEditorToolbar({ isInRelationshipDrawingMode: false });
      const addButton = screen.getByRole('button', {
        name: 'Add Relationship',
      });
      expect(addButton).to.have.attribute('aria-pressed', 'false');
    });

    it('clicking on it calls onRelationshipDrawingToggle', function () {
      const relationshipDrawingToggleSpy = sinon.spy();
      renderDiagramEditorToolbar({
        onRelationshipDrawingToggle: relationshipDrawingToggleSpy,
      });
      const addRelationshipButton = screen.getByRole('button', {
        name: 'Add Relationship',
      });
      userEvent.click(addRelationshipButton);
      expect(relationshipDrawingToggleSpy).to.have.been.calledOnce;
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
});
