import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { DiagramCard } from './diagram-card';
import type { Edit } from '../services/data-model-storage';

describe('DiagramCard', () => {
  const props = {
    diagram: {
      id: 'test-diagram',
      connectionId: 'test-connection',
      name: 'Test Diagram',
      createdAt: '2021-10-01T00:00:00.000Z',
      updatedAt: '2023-10-03T00:00:00.000',
      edits: [
        {
          id: 'edit-id',
          timestamp: '2022-10-01T00:00:00.000Z',
          type: 'SetModel',
          model: {
            collections: [
              {
                ns: 'db.collection',
                indexes: [],
                displayPosition: [0, 0],
                shardKey: {},
                jsonSchema: { bsonType: 'object' },
              },
            ],
            relationships: [],
          },
        },
      ] as [Edit],
      databases: 'someDatabase',
    },
    onOpen: () => {},
    onDelete: () => {},
    onRename: () => {},
  };

  it('renders name, database, last edited', () => {
    render(<DiagramCard {...props} />);
    expect(screen.getByText('Test Diagram')).to.be.visible;
    expect(screen.getByText('someDatabase')).to.be.visible;
    expect(screen.getByText('Last modified: October 3, 2023')).to.be.visible;
  });
});
