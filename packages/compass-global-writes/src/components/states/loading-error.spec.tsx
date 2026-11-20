import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import { renderWithStore } from '../../../tests/create-store';
import { LoadingError } from './loading-error';

const error = 'Test failure';

function renderWithProps(
  props?: Partial<React.ComponentProps<typeof LoadingError>>
) {
  return renderWithStore(<LoadingError error={error} {...props} />);
}

describe('LoadingError', function () {
  it('renders the error', async function () {
    await renderWithProps();
    expect(screen.getByText(error)).to.exist;
  });
});
