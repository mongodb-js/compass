import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import { Icon } from '../';

describe('Icon Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should render an element with a title', function () {
    render(
      <div>
        <Icon glyph="Database" title="databases-icon" />
      </div>
    );
    const iconComponent = screen.getByTitle('databases-icon');
    expect(iconComponent).to.be.visible;
  });
});
