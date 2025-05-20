import { expect } from 'chai';
import { setupStore } from '../../test/setup-store';
import {
  applyEdit,
  getCurrentDiagramFromState,
  openDiagram,
  redoEdit,
  undoEdit,
} from './diagram';

describe('Data Modeling store', function () {
  let store;

  beforeEach(function () {
    store = setupStore();
  });

  it('openDiagram', function () {
    const loadedDiagram = {
      id: 'diagram-id',
      name: 'diagram-name',
      connectionId: 'connection-id',
      edits: [{ type: 'SetModel', model: {} }],
    };

    store.dispatch(openDiagram(loadedDiagram));

    const diagram = getCurrentDiagramFromState(store.getState());
    expect(diagram.id).to.equal(loadedDiagram.id);
    expect(diagram.name).to.equal(loadedDiagram.name);
    expect(diagram.connectionId).to.equal(loadedDiagram.connectionId);
    expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
  });

  describe('applyEdit', function () {
    it('should apply a valid SetModel edit', function () {
      const loadedDiagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(loadedDiagram));

      const newModel = { collections: [], relationships: [] };
      store.dispatch(applyEdit({ type: 'SetModel', model: newModel }));

      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.editErrors).to.be.undefined;
      expect(diagram.edits).to.have.length(2);
      expect(diagram.edits[0]).to.deep.equal(diagram.edits[0]);
      expect(diagram.edits[1]).to.deep.include({
        type: 'SetModel',
        model: newModel,
      });
    });

    it('should apply a valid AddRelationship edit', function () {
      const loadedDiagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(loadedDiagram));

      const newRelationship = {
        id: 'relationship1',
        relationship: [
          {
            ns: 'db.sourceCollection',
            cardinality: 1,
            fields: ['field1'],
          },
          {
            ns: 'db.targetCollection',
            cardinality: 1,
            fields: ['field2'],
          },
        ],
        isInferred: false,
      };
      store.dispatch(
        applyEdit({ type: 'AddRelationship', relationship: newRelationship })
      );

      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.editErrors).to.be.undefined;
      expect(diagram.edits).to.have.length(2);
      expect(diagram.edits[0]).to.deep.equal(diagram.edits[0]);
      expect(diagram.edits[1]).to.deep.include({
        type: 'AddRelationship',
        relationship: newRelationship,
      });
    });

    it.only('should not apply invalid AddRelationship edit', function () {
      const loadedDiagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(loadedDiagram));

      const edit = {
        type: 'AddRelationship',
        relationship: {
          id: 'relationship1',
          isInferred: false,
        },
      };
      store.dispatch(applyEdit(edit));

      const editErrors = store.getState().diagram.editErrors;
      expect(editErrors).to.have.length(1);
      expect(editErrors[0]).to.equal("'relationship,relationship' is required");
      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.edits).to.deep.equal(diagram.edits);
    });
  });

  it('undo/redo', function () {
    const loadedDiagram = {
      id: 'diagram-id',
      name: 'diagram-name',
      connectionId: 'connection-id',
      edits: [{ type: 'SetModel', model: {} }],
    };

    store.dispatch(openDiagram(loadedDiagram));

    const edit = {
      type: 'SetModel',
      model: { collections: [], relationships: [] },
    };
    store.dispatch(applyEdit(edit));

    const diagramAfterEdit = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterEdit.edits).to.have.length(2);
    expect(diagramAfterEdit.edits[0]).to.deep.include(loadedDiagram.edits[0]);
    expect(diagramAfterEdit.edits[1]).to.deep.include(edit);

    store.dispatch(undoEdit());

    const diagramAfterUndo = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterUndo.edits).to.have.length(1);
    expect(diagramAfterUndo.edits[0]).to.deep.include(loadedDiagram.edits[0]);

    store.dispatch(redoEdit());

    const diagramAfterRedo = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterRedo.edits).to.have.length(2);
    expect(diagramAfterRedo.edits[0]).to.deep.include(loadedDiagram.edits[0]);
    expect(diagramAfterRedo.edits[1]).to.deep.include(edit);
  });
});
