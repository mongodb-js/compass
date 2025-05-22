import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { DiagramCard } from './diagram-card';

describe('DiagramCard', () => {
  const props = {
    diagram: {
      id: 'test-diagram',
      connectionId: 'test-connection',
      name: 'Test Diagram',
      edits: [],
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
