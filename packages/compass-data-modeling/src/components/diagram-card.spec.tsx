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
      edits: [
        {
          id: 'edit-id',
          timestamp: '2023-10-01T00:00:00.000Z',
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
      lastModified: new Date('2025-01-01').getTime(),
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
    expect(screen.getByText('Last modified: January 1, 2025')).to.be.visible;
  });
});
