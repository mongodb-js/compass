import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { PipelineName } from './pipeline-name';

describe('PipelineName', function () {
  it('renders Untitled as default name', function () {
    render(<PipelineName name={''} isModified={false} />);
    expect(screen.getByTestId('pipeline-name').textContent.trim()).to.equal(
      'Untitled'
    );
  });

  it('renders Untitled as default name with modified text - when modified', function () {
    render(<PipelineName name={''} isModified={true} />);
    expect(
      screen
        .getByTestId('pipeline-name')
        .textContent.trim()
        .replace(/\u00a0/g, ' ')
    ).to.equal('Untitled – modified');
  });

  it('renders pipeline name', function () {
    render(<PipelineName name={'Hello'} isModified={false} />);
    expect(screen.getByTestId('pipeline-name').textContent.trim()).to.equal(
      'Hello'
    );
  });

  it('renders pipeline name with modified text - when modified', function () {
    render(<PipelineName name={'Name changed'} isModified={true} />);
    expect(
      screen
        .getByTestId('pipeline-name')
        .textContent.trim()
        .replace(/\u00a0/g, ' ')
    ).to.equal('Name changed – modified');
  });
});
