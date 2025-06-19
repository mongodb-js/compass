import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';

import { DocumentPreview } from './document-preview';

describe('DocumentPreview [Component]', function () {
  context('when document loading state is success', function () {
    it('renders a document if there is one present', function () {
      render(<DocumentPreview document={{}} />);
      expect(screen.getByTestId('hadron-document')).to.be.visible;
    });

    it('renders a no preview text when there is no document', function () {
      render(<DocumentPreview />);
      expect(screen.getByText('No Preview Documents')).to.be.visible;
    });
  });
});
