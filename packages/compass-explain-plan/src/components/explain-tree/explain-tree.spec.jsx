import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';


import ExplainTree from '../explain-tree';

describe('ExplainTree [Component]', function() {
  const nodes = [];
  const links = [];
  const width = 100;
  const height = 100;

  beforeEach(function() {
    render(<ExplainTree nodes={nodes} links={links} width={width} height={height} />);
  });

  it('renders', function() {
    expect(screen.getByTestId('explain-tree')).to.exist;
  });
});