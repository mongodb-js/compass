import React from 'react';
import { render, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { palette } from '@leafygreen-ui/palette';

import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';
import { CloneIcon } from './clone-icon';

describe('CloneIcon Component', function () {
  afterEach(cleanup);

  it('should render an svg icon', function () {
    const { container } = render(<CloneIcon />);
    expect(container.querySelector('svg')).to.exist;
  });

  it('should use the dark color for the sheets in light mode', function () {
    const { container } = render(
      <LeafyGreenProvider darkMode={false}>
        <CloneIcon />
      </LeafyGreenProvider>
    );
    const strokedPaths = container.querySelectorAll('svg [stroke]');
    expect(strokedPaths.length).to.be.greaterThan(0);
    expect(strokedPaths[0].getAttribute('stroke')).to.equal(palette.black);
  });

  it('should use the light color for the sheets in dark mode', function () {
    const { container } = render(
      <LeafyGreenProvider darkMode={true}>
        <CloneIcon />
      </LeafyGreenProvider>
    );
    const strokedPaths = container.querySelectorAll('svg [stroke]');
    expect(strokedPaths.length).to.be.greaterThan(0);
    expect(strokedPaths[0].getAttribute('stroke')).to.equal(palette.white);
  });
});
