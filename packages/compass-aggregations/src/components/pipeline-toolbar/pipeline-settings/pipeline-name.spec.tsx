import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { PipelineName } from './pipeline-name';

describe('PipelineName', function () {
  // The chip is intentionally hidden when the pipeline has no name —
  // that's the "scratchpad / never saved" state. We mirror the
  // LoadedFavoriteChip in compass-query-bar, which is also hidden when
  // no favorite is loaded; consistent absence-as-signal across both
  // tabs.
  it('renders nothing when name is empty (untitled pipeline)', function () {
    render(<PipelineName name={''} isModified={false} />);
    expect(screen.queryByTestId('pipeline-name')).to.equal(null);
  });

  it('renders nothing when name is empty even with isModified true', function () {
    render(<PipelineName name={''} isModified={true} />);
    expect(screen.queryByTestId('pipeline-name')).to.equal(null);
  });

  it('renders the name in a chip when set', function () {
    render(<PipelineName name={'Q4 customers'} isModified={false} />);
    const chip = screen.getByTestId('pipeline-name');
    expect(chip).to.exist;
    expect(chip.textContent).to.contain('Q4 customers');
    expect(chip.getAttribute('data-dirty')).to.equal('false');
    expect(screen.queryByTestId('pipeline-name-dirty-dot')).to.equal(null);
  });

  it('shows the dirty dot when isModified', function () {
    render(<PipelineName name={'Q4 customers'} isModified={true} />);
    const chip = screen.getByTestId('pipeline-name');
    expect(chip.getAttribute('data-dirty')).to.equal('true');
    expect(screen.getByTestId('pipeline-name-dirty-dot')).to.exist;
  });

  it('mentions unsaved changes in the tooltip-bearing title attr when dirty', function () {
    render(<PipelineName name={'Q4 customers'} isModified={true} />);
    const chip = screen.getByTestId('pipeline-name');
    expect(chip.getAttribute('title')).to.contain('unsaved changes');
  });

  it('does not mention unsaved changes in title when clean', function () {
    render(<PipelineName name={'Q4 customers'} isModified={false} />);
    const chip = screen.getByTestId('pipeline-name');
    expect(chip.getAttribute('title')).to.not.contain('unsaved changes');
  });
});
