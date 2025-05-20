import { expect } from 'chai';
import { setupStore } from '../../test/setup-store';
import { applyEdit, openDiagram } from './diagram';

describe('Data Modeling store', function () {
  let store;

  beforeEach(function () {
    store = setupStore();
  });

  it('openDiagram', function () {
    const diagram = {
      id: 'diagram-id',
      name: 'diagram-name',
      connectionId: 'connection-id',
      edits: [{ type: 'SetModel', model: {} }],
    };

    store.dispatch(openDiagram(diagram));

    expect(store.getState().diagram.id).to.equal(diagram.id);
    expect(store.getState().diagram.name).to.equal(diagram.name);
    expect(store.getState().diagram.connectionId).to.equal(
      diagram.connectionId
    );
    expect(store.getState().diagram.edits.current).to.deep.equal(diagram.edits);
  });

  it('openDiagram', function () {
    const diagram = {
      id: 'diagram-id',
      name: 'diagram-name',
      connectionId: 'connection-id',
      edits: [{ type: 'SetModel', model: {} }],
    };

    store.dispatch(openDiagram(diagram));

    expect(store.getState().diagram.id).to.equal(diagram.id);
    expect(store.getState().diagram.name).to.equal(diagram.name);
    expect(store.getState().diagram.connectionId).to.equal(
      diagram.connectionId
    );
    expect(store.getState().diagram.edits.current).to.deep.equal(diagram.edits);
  });

  describe('applyEdit', function () {
    it('should apply a valid SetModel edit', function () {
      const diagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(diagram));

      const newModel = { collections: [], relationships: [] };
      store.dispatch(applyEdit({ type: 'SetModel', model: newModel }));

      const state = store.getState();
      expect(state.diagram.editErrors).to.be.undefined;
      expect(state.diagram.edits.current[0]).to.deep.equal(diagram.edits[0]);
      expect(state.diagram.edits.current[1]).to.deep.include({
        type: 'SetModel',
        model: newModel,
      });
    });

    it('should apply a valid AddRelationship edit', function () {
      const diagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(diagram));

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

      const state = store.getState();
      expect(state.diagram.editErrors).to.be.undefined;
      expect(state.diagram.edits.current[0]).to.deep.equal(diagram.edits[0]);
      expect(state.diagram.edits.current[1]).to.deep.include({
        type: 'AddRelationship',
        relationship: newRelationship,
      });
    });

    it.only('should not apply invalid AddRelationship edit', function () {
      const diagram = {
        id: 'diagram-id',
        name: 'diagram-name',
        connectionId: 'connection-id',
        edits: [{ type: 'SetModel', model: {} }],
      };

      store.dispatch(openDiagram(diagram));

      const newRelationship = {
        id: 'relationship1',
        isInferred: false,
      };
      store.dispatch(
        applyEdit({ type: 'AddRelationship', relationship: newRelationship })
      );

      const state = store.getState();
      expect(state.diagram.editErrors).to.have.length(1);
      expect(state.diagram.editErrors[0]).to.equal(
        "'relationship,relationship' is required"
      );
      expect(state.diagram.edits.current).to.deep.equal(diagram.edits);
    });
  });
});
