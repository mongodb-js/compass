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
      const diagramInstance = {
        getNodes: () => [
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
        ],
        getEdges: () => [],
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(nodes).to.deep.equal([
        {
          id: '1',
          title: 'Node 1',
          type: 'collection',
          position: { x: 0, y: 0 },
          fields: [],
          selected: false,
        },
        {
          id: '2',
          title: 'Node 2',
          type: 'collection',
          position: { x: 0, y: 0 },
          fields: [],
          selected: false,
        },
      ]);
      expect(edges).to.deep.equal([]);
    });

    it('override selected to false and variant to undefined for nodes.fields', function () {
      const diagramInstance = {
        getNodes: () => [
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
            fields: [
              {
                name: 'field1',
                selected: true,
                variant: 'primary' as const,
              },
              {
                name: 'field1',
              },
            ],
          },
        ],
        getEdges: () => [],
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(nodes).to.deep.equal([
        {
          id: '1',
          title: 'Node 1',
          type: 'collection',
          position: { x: 0, y: 0 },
          fields: [],
          selected: false,
        },
        {
          id: '2',
          title: 'Node 2',
          type: 'collection',
          position: { x: 0, y: 0 },
          fields: [
            {
              name: 'field1',
              selected: false,
              variant: undefined,
            },
            { name: 'field1', selected: false, variant: undefined },
          ],
          selected: false,
        },
      ]);
      expect(edges).to.deep.equal([]);
    });

    it('override selected and animated to be false for edges', function () {
      const diagramInstance = {
        getNodes: () => [],
        getEdges: () => [
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
        ],
      };
      const { edges, nodes } = getDiagramNodesAndEdges(diagramInstance);
      expect(edges).to.deep.equal([
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          selected: false,
          animated: false,
          markerStart: 'many',
          markerEnd: 'one',
        },
        {
          id: 'edge2',
          source: 'node2',
          target: 'node3',
          selected: false,
          animated: false,
          markerStart: 'one',
          markerEnd: 'many',
        },
      ]);
      expect(nodes).to.deep.equal([]);
    });
  });
});
