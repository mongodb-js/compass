import { expect } from 'chai';
import {
  getExportJsonFromModel,
  getDiagramNodesAndEdges,
} from './export-diagram';
import FlightModel from '../../test/fixtures/flights-model.json';

describe('export-diagram', function () {
  context('json export', function () {
    it('should convert a model to JSON', function () {
      const json = getExportJsonFromModel(FlightModel as any);

      const expectedCollections = Object.fromEntries(
        FlightModel.collections
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ ns, jsonSchema, ...rest }) => [ns, { ns, jsonSchema }])
      );
      expect(json.collections).to.deep.equal(expectedCollections);

      expect(json.relationships.length).to.equal(
        FlightModel.relationships.length
      );
    });
  });

  context('getDiagramNodesAndEdges', function () {
    it('should override selected to be false for nodes', function () {
      const originalNodes = [
        {
          id: '1',
          title: 'Node 1',
          type: 'collection' as const,
          position: { x: 0, y: 0 },
          fields: [],
        },
        {
          id: '2',
          title: 'Node 2',
          type: 'collection' as const,
          position: { x: 0, y: 0 },
          fields: [],
        },
      ];
      const diagramInstance = {
        getNodes: () => originalNodes,
        getEdges: () => [],
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(nodes).to.deep.equal([
        {
          ...originalNodes[0],
          selected: false,
        },
        {
          ...originalNodes[1],
          selected: false,
        },
      ]);
      expect(edges).to.deep.equal([]);
    });

    it('override selected to false and variant to undefined for nodes.fields', function () {
      const originalNodes = [
        {
          id: '2',
          title: 'Node 2',
          type: 'collection' as const,
          position: { x: 0, y: 0 },
          fields: [
            {
              name: 'field1',
              selected: true,
              variant: 'primary' as const,
            },
            {
              name: 'field2',
            },
          ],
        },
      ];
      const diagramInstance = {
        getNodes: () => originalNodes,
        getEdges: () => [],
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(nodes).to.deep.equal([
        {
          ...originalNodes[0],
          fields: [
            {
              ...originalNodes[0].fields[0],
              selected: false,
              variant: undefined,
            },
            {
              ...originalNodes[0].fields[1],
              selected: false,
              variant: undefined,
            },
          ],
          selected: false,
        },
      ]);
      expect(edges).to.deep.equal([]);
    });

    it('override selected and animated to be false for edges', function () {
      const originalEdges = [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          selected: true,
          markerStart: 'many' as const,
          markerEnd: 'one' as const,
        },
        {
          id: 'edge2',
          source: 'node2',
          target: 'node3',
          markerStart: 'one' as const,
          markerEnd: 'many' as const,
        },
      ];
      const diagramInstance = {
        getNodes: () => [],
        getEdges: () => originalEdges,
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(edges).to.deep.equal([
        {
          ...originalEdges[0],
          selected: false,
          animated: false,
        },
        {
          ...originalEdges[1],
          selected: false,
          animated: false,
        },
      ]);
      expect(nodes).to.deep.equal([]);
    });
  });
});
