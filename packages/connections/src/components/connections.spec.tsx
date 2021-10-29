import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import Connections from './connections';

describe('Connections Component', function () {
  describe('when rendered', function () {
    beforeEach(function () {
      render(<Connections />);
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect').closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product'
      );
    });
  });
});
