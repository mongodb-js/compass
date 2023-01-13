import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { EmptyContent } from './empty-content';

describe('EmptyContent', function () {
  it('should render the elements passed', function () {
    render(
      <EmptyContent
        icon={() => <div>Test icon</div>}
        title="Pineapple"
        subTitle="The capital of Madagascar"
        callToAction="Antananarivo"
      />
    );

    expect(screen.getByText('Test icon')).to.be.visible;
    expect(screen.getByText('Pineapple')).to.be.visible;
    expect(screen.getByText('The capital of Madagascar')).to.be.visible;
    expect(screen.getByText('Antananarivo')).to.be.visible;
  });
});
